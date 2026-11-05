import { addDoc, collection, doc, runTransaction, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, WORKER_URL } from "./firebase";
import type { LedgerEntry, Order, OrderItem, Stage } from "./types";

export const newCode = () => "ZC-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

export async function createOrder(o: { uid: string; customerName: string; phone: string; address: string; items: OrderItem[]; rate: number; designFile?: string }) {
  const total = Math.round(o.items.reduce((a, i) => a + i.totalUSD, 0) * 100) / 100;
  const now = Date.now();
  const data: Omit<Order, "id"> = {
    code: newCode(), uid: o.uid, customerName: o.customerName, phone: o.phone, address: o.address, items: o.items,
    totalUSD: total, rate: o.rate, stage: "new", payment: { status: "unpaid" },
    history: [{ stage: "new", at: now, by: "customer" }], createdAt: now, ...(o.designFile ? { designFile: o.designFile } : {}),
  };
  const ref = await addDoc(collection(db, "orders"), data);
  return ref.id;
}

async function post(path: string, form: FormData) {
  if (!WORKER_URL) throw new Error("WORKER_URL not set");
  const token = await auth.currentUser?.getIdToken();
  const r = await fetch(WORKER_URL + path, { method: "POST", body: form, headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
// الإيصال: يُحفظ مضغوطاً في Firestore فيظهر فوراً للإدارة؛ وإن وُجد الـ Worker يُرسَل أيضاً لتلغرام (اختياري)
export async function uploadReceipt(order: Order, file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please upload an image (PNG/JPG)");
  const image = await compressImage(file, 1100, true);
  const now = Date.now();
  await setDoc(doc(db, "receipts", order.id), { orderId: order.id, uid: order.uid, image, at: now });
  await updateDoc(doc(db, "orders", order.id), { payment: { status: "pending", receiptAt: now }, history: [...order.history, { stage: "payment", at: now, by: "customer", note: "receipt" }] });
  if (WORKER_URL) { try { const f = new FormData(); f.set("orderId", order.id); f.set("file", file); await post("/receipt", f); } catch { /* تلغرام اختياري */ } }
}
export const uploadDesign = (file: File) => { const f = new FormData(); f.set("file", file); return post("/design", f); };

export async function moveStage(order: Order, stage: Stage, by: string, note?: string) {
  await updateDoc(doc(db, "orders", order.id), { stage, history: [...order.history, { stage, at: Date.now(), by, ...(note ? { note } : {}) }] });
}
export async function addLedger(e: Omit<LedgerEntry, "id">) { await addDoc(collection(db, "ledger"), e); }
// تسجيل دفع نقدي/يدوي من الإدارة
export async function markPaidManually(order: Order, by: string) {
  await runTransaction(db, async tx => {
    const ref = doc(db, "orders", order.id);
    tx.update(ref, { "payment.status": "confirmed", history: [...order.history, { stage: "payment", at: Date.now(), by, note: "manual" }] });
    tx.set(doc(collection(db, "ledger")), { type: "income", amountUSD: order.totalUSD, title: `${order.code}`, category: "sales", orderId: order.id, date: Date.now(), by } satisfies Omit<LedgerEntry, "id">);
  });
}
// ضغط صورة QR لتصبح صغيرة وتُحفظ داخل Firestore (بدون Storage)
export function compressImage(file: File, max = 520, jpeg = false): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image(); img.onerror = rej;
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = img.width * s; c.height = img.height * s;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); res(jpeg ? c.toDataURL("image/jpeg", 0.82) : c.toDataURL("image/png"));
    };
    img.src = URL.createObjectURL(file);
  });
}

export const MSG_PAY_OK = "تم تأكيد الدفع";
export const MSG_PAY_REJECT = "تم رفض طلبك، سيتم إعادة أموالك في أقرب وقت";
// تأكيد الدفع من الإدارة: تحديث الطلب + قيد إيراد
export async function confirmPayment(order: Order, by: string) {
  await runTransaction(db, async tx => {
    tx.update(doc(db, "orders", order.id), { payment: { status: "confirmed", receiptAt: order.payment.receiptAt ?? Date.now() }, history: [...order.history, { stage: "payment", at: Date.now(), by, note: MSG_PAY_OK }] });
    tx.set(doc(collection(db, "ledger")), { type: "income", amountUSD: order.totalUSD, title: order.code, category: "sales", orderId: order.id, date: Date.now(), by } satisfies Omit<LedgerEntry, "id">);
  });
}
export async function rejectPayment(order: Order, by: string) {
  const now = Date.now();
  await updateDoc(doc(db, "orders", order.id), { stage: "cancelled", payment: { status: "rejected", receiptAt: order.payment.receiptAt ?? now, rejectReason: MSG_PAY_REJECT }, history: [...order.history, { stage: "payment", at: now, by, note: MSG_PAY_REJECT }, { stage: "cancelled", at: now, by }] });
}

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { confirmPayment, rejectPayment } from "../lib/api";
import type { Order } from "../lib/types";

export function ReceiptImage({ orderId, className = "" }: { orderId: string; className?: string }) {
  const { t } = useI18n(); const [img, setImg] = useState<string | null | undefined>(undefined); const [big, setBig] = useState(false);
  useEffect(() => onSnapshot(doc(db, "receipts", orderId), s => setImg(s.exists() ? (s.data().image as string) : null), () => setImg(null)), [orderId]);
  if (img === undefined) return <div className={`skeleton ${className}`} />;
  if (!img) return <div className={`grid place-items-center text-sm text-slate-600 bg-ink/5 rounded-xl ${className}`}>{t("noReceipt")}</div>;
  return (
    <>
      <button onClick={() => setBig(true)} className={`block overflow-hidden rounded-xl border border-line ${className}`} aria-label={t("receipt")}><img src={img} alt={t("receipt")} className="w-full h-full object-cover" /></button>
      {big && <div className="fixed inset-0 z-[60] bg-black/80 grid place-items-center p-4" onClick={() => setBig(false)}><img src={img} alt={t("receipt")} className="max-h-[92vh] max-w-full rounded-xl" /></div>}
    </>
  );
}

export function PayActions({ order }: { order: Order }) {
  const { t } = useI18n(); const { user, role } = useAuth(); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  if (order.payment.status !== "pending" || !(role === "admin" || role === "accountant")) return null;
  const by = user?.email || user?.uid || "staff";
  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(""); try { await fn(); } catch (e) { setErr((e as Error).message); } setBusy(false); };
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-primary !py-1" disabled={busy} onClick={() => run(() => confirmPayment(order, by))}>{t("confirmPay")}</button>
        <button className="btn btn-ghost !py-1 !text-rose-700 !border-rose-300" disabled={busy} onClick={() => confirm(t("rejectConfirm")) && run(() => rejectPayment(order, by))}>{t("rejectPay")}</button>
      </div>
      {err && <p className="text-rose-600 text-sm">{err}</p>}
    </div>
  );
}

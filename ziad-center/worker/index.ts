/// <reference types="@cloudflare/workers-types" />
// Cloudflare Worker (مجاني): يربط الموقع ↔ بوت تلغرام ↔ Firestore بدون Cloud Functions.
interface Env { FB_PROJECT_ID: string; FB_API_KEY: string; ALLOWED_ORIGIN: string; ADMIN_CHAT_IDS: string; TG_BOT_TOKEN: string; TG_WEBHOOK_SECRET: string; SA_JSON: string }
const MSG_REJECT = "تم رفض طلبك، سيتم إعادة أموالك في أقرب وقت";
const MSG_OK = "تم تأكيد الدفع";

const cors = (env: Env) => ({ "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN, "Access-Control-Allow-Headers": "Authorization,Content-Type", "Access-Control-Allow-Methods": "POST,OPTIONS" });
const json = (env: Env, d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", ...cors(env) } });

// ---------- Firestore REST helpers ----------
const enc = (v: any): any => v === null ? { nullValue: null } : typeof v === "string" ? { stringValue: v } : typeof v === "boolean" ? { booleanValue: v }
  : typeof v === "number" ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : Array.isArray(v) ? { arrayValue: { values: v.map(enc) } }
  : { mapValue: { fields: Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, enc(x)])) } };
const dec = (v: any): any => "stringValue" in v ? v.stringValue : "integerValue" in v ? +v.integerValue : "doubleValue" in v ? v.doubleValue : "booleanValue" in v ? v.booleanValue
  : "arrayValue" in v ? (v.arrayValue.values || []).map(dec) : "mapValue" in v ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)])) : null;

const b64u = (b: ArrayBuffer | string) => btoa(typeof b === "string" ? b : String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
let tok: { t: string; exp: number } | null = null;
async function saToken(env: Env) {
  if (tok && tok.exp > Date.now() + 60_000) return tok.t;
  const sa = JSON.parse(env.SA_JSON); const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64u(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const pem = sa.private_key.replace(/-----[^-]+-----|\s/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${head}.${body}`));
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${head}.${body}.${b64u(sig)}` });
  const j: any = await r.json(); tok = { t: j.access_token, exp: Date.now() + j.expires_in * 1000 }; return tok.t;
}
const base = (env: Env) => `https://firestore.googleapis.com/v1/projects/${env.FB_PROJECT_ID}/databases/(default)/documents`;
async function getDoc(env: Env, path: string) {
  const r = await fetch(`${base(env)}/${path}`, { headers: { Authorization: `Bearer ${await saToken(env)}` } });
  if (!r.ok) return null; const d: any = await r.json(); return dec({ mapValue: { fields: d.fields } });
}
async function patchDoc(env: Env, path: string, data: Record<string, any>) {
  const mask = Object.keys(data).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  const r = await fetch(`${base(env)}/${path}?${mask}`, { method: "PATCH", headers: { Authorization: `Bearer ${await saToken(env)}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields: enc(data).mapValue.fields }) });
  if (!r.ok) throw new Error(await r.text());
}
async function addDoc(env: Env, col: string, data: Record<string, any>) {
  await fetch(`${base(env)}/${col}`, { method: "POST", headers: { Authorization: `Bearer ${await saToken(env)}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields: enc(data).mapValue.fields }) });
}
async function verifyUser(env: Env, req: Request): Promise<string | null> {
  const t = (req.headers.get("Authorization") || "").replace("Bearer ", ""); if (!t) return null;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FB_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: t }) });
  if (!r.ok) return null; const j: any = await r.json(); return j.users?.[0]?.localId ?? null;
}
const tg = (env: Env, method: string, body: BodyInit, json = false) => fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/${method}`, { method: "POST", body, ...(json ? { headers: { "Content-Type": "application/json" } } : {}) });
const ADMIN = (env: Env) => env.ADMIN_CHAT_IDS.split(",").map(s => s.trim()).filter(Boolean);

// ---------- handlers ----------
async function sendFile(env: Env, file: File, caption: string, markup?: unknown) {
  const isImg = file.type.startsWith("image/");
  for (const chat of ADMIN(env)) {
    const f = new FormData(); f.set("chat_id", chat); f.set("caption", caption); f.set("parse_mode", "HTML");
    f.set(isImg ? "photo" : "document", file, file.name);
    if (markup) f.set("reply_markup", JSON.stringify(markup));
    await tg(env, isImg ? "sendPhoto" : "sendDocument", f);
  }
}
const esc = (s: string) => s.replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

async function receipt(env: Env, req: Request) {
  const uid = await verifyUser(env, req); if (!uid) return json(env, "unauthorized", 401);
  const form = await req.formData(); const orderId = String(form.get("orderId") || ""); const file = form.get("file") as File | null;
  if (!file || !orderId || file.size > 8_000_000) return json(env, "bad request", 400);
  const o: any = await getDoc(env, `orders/${orderId}`);
  if (!o || o.uid !== uid) return json(env, "forbidden", 403);
  // الموقع يحفظ الإيصال والحالة (pending) في Firestore بنفسه؛ هنا فقط إشعار تلغرام بأزرار تأكيد/رفض
  if (o.payment.status !== "pending") return json(env, "not pending", 409);
  await sendFile(env, file, `<b>إيصال دفع جديد</b>\nالطلب: <code>${esc(o.code)}</code>\nالزبون: ${esc(o.customerName)} (${esc(o.phone)})\nالمبلغ: <b>$${o.totalUSD}</b> ≈ ${Math.round(o.totalUSD * o.rate).toLocaleString("en-US")} ل.س`,
    { inline_keyboard: [[{ text: "تأكيد", callback_data: `ok:${orderId}` }, { text: "رفض", callback_data: `no:${orderId}` }]] });
  return json(env, { ok: true });
}
async function design(env: Env, req: Request) {
  const uid = await verifyUser(env, req); if (!uid) return json(env, "unauthorized", 401);
  const file = (await req.formData()).get("file") as File | null; if (!file || file.size > 15_000_000) return json(env, "bad request", 400);
  await sendFile(env, file, `ملف تصميم من زبون (uid: <code>${uid.slice(0, 8)}</code>) — ${esc(file.name)}`);
  return json(env, { ok: true, name: file.name });
}
async function webhook(env: Env, req: Request) {
  if (req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.TG_WEBHOOK_SECRET) return new Response("no", { status: 403 });
  const u: any = await req.json(); const cb = u.callback_query; if (!cb) return new Response("ok");
  const answer = (text: string) => tg(env, "answerCallbackQuery", JSON.stringify({ callback_query_id: cb.id, text }), true);
  if (!ADMIN(env).includes(String(cb.from.id))) { await answer("غير مصرّح"); return new Response("ok"); }
  const [act, orderId] = String(cb.data).split(":");
  const o: any = await getDoc(env, `orders/${orderId}`);
  if (!o) { await answer("الطلب غير موجود"); return new Response("ok"); }
  if (o.payment.status !== "pending") { await answer("تمت معالجته مسبقاً"); return new Response("ok"); }
  const by = `telegram:${cb.from.username || cb.from.id}`; const now = Date.now();
  if (act === "ok") {
    await patchDoc(env, `orders/${orderId}`, { payment: { status: "confirmed", receiptAt: o.payment.receiptAt }, history: [...o.history, { stage: "payment", at: now, by, note: MSG_OK }] });
    await addDoc(env, "ledger", { type: "income", amountUSD: o.totalUSD, title: o.code, category: "sales", orderId, date: now, by });
  } else {
    await patchDoc(env, `orders/${orderId}`, { stage: "cancelled", payment: { status: "rejected", receiptAt: o.payment.receiptAt, rejectReason: MSG_REJECT }, history: [...o.history, { stage: "payment", at: now, by, note: MSG_REJECT }, { stage: "cancelled", at: now, by }] });
  }
  await answer(act === "ok" ? "تم التأكيد" : "تم الرفض");
  await tg(env, "editMessageReplyMarkup", JSON.stringify({ chat_id: cb.message.chat.id, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [[{ text: act === "ok" ? "تم التأكيد" : "تم الرفض", callback_data: "done" }]] } }), true);
  return new Response("ok");
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: cors(env) });
    try {
      if (req.method === "POST" && pathname === "/receipt") return await receipt(env, req);
      if (req.method === "POST" && pathname === "/design") return await design(env, req);
      if (req.method === "POST" && pathname === "/tg") return await webhook(env, req);
    } catch (e) { return json(env, String(e), 500); }
    return json(env, "not found", 404);
  },
};

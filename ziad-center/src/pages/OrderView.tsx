import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useI18n, type Key } from "../lib/i18n";
import { useData } from "../lib/data";
import { uploadReceipt } from "../lib/api";
import type { Order } from "../lib/types";
import { Page } from "../components/Page";
import Timeline from "../components/Timeline";

export default function OrderView() {
  const { id } = useParams(); const { t, pick, money } = useI18n(); const { settings, products } = useData();
  const [o, setO] = useState<Order | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => id ? onSnapshot(doc(db, "orders", id), s => s.exists() && setO({ ...(s.data() as Order), id: s.id })) : undefined, [id]);
  if (!o) return <div className="max-w-3xl mx-auto p-10"><div className="skeleton h-60" /></div>;
  const pay = o.payment.status;
  const send = async (f?: File) => {
    if (!f) return; setBusy(true); setErr("");
    try { await uploadReceipt(o.id, f); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <Page className="max-w-3xl mx-auto px-4 pt-10 space-y-5">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-extrabold">{t("order")} <span dir="ltr" className="grad-text">{o.code}</span></h1><b className="text-xl text-cyan">{money(o.totalUSD, settings.usdToSyp)}</b></div>

      {pay === "unpaid" && o.stage !== "cancelled" && (
        <div className="card p-6 text-center space-y-4 border-cyan/50">
          <h2 className="text-xl font-extrabold">{t("payTitle")}</h2>
          <p className="text-sm text-slate-400">1) {t("payStep1")}</p>
          {settings.shamcashQr ? <img src={settings.shamcashQr} alt="Sham Cash QR" className="mx-auto w-56 h-56 object-contain rounded-2xl bg-white p-2" /> : <div className="text-slate-500">{t("noQr")}</div>}
          {settings.shamcashAccount && <p className="text-sm">{t("account")}: <b dir="ltr" className="select-all">{settings.shamcashAccount}</b></p>}
          <div className="text-2xl font-extrabold">{money(o.totalUSD, settings.usdToSyp)} <span className="text-sm text-slate-400" dir="ltr">(${o.totalUSD})</span></div>
          <p className="text-sm text-slate-400">2) {t("payStep2")}</p>
          <input ref={input} type="file" accept="image/*,.pdf" hidden onChange={e => send(e.target.files?.[0])} />
          <button className="btn btn-primary" disabled={busy} onClick={() => input.current?.click()}>{busy ? t("sending") : "📤 " + t("uploadReceipt")}</button>
          {err && <p className="text-rose-400 text-sm">{err}</p>}
        </div>
      )}
      {pay === "pending" && <div className="card p-5 text-center text-yellow">⏳ {t("receiptSent")}</div>}
      {pay === "confirmed" && <div className="card p-5 text-center text-emerald-400 font-bold">{t("payConfirmed")}</div>}
      {pay === "rejected" && <div className="card p-5 text-center text-rose-400 font-bold">{t("payRejected")}</div>}

      <div className="card p-5"><Timeline order={o} /></div>
      <div className="card p-5 space-y-2 text-sm">
        {o.items.map((i, n) => { const p = products.find(x => x.id === i.productId); return <div key={n} className="flex justify-between"><span>{p ? pick(p) : i.name} × {i.qty}{i.customSize && ` (${i.customSize})`}</span><b>{money(i.totalUSD, settings.usdToSyp)}</b></div>; })}
        <div className="text-slate-500 pt-2 border-t border-line">{t(`p_${pay}` as Key)} • {o.address}</div>
      </div>
    </Page>
  );
}

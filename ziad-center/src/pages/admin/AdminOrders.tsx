import { useState } from "react";
import { useI18n, type Key } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import { useData } from "../../lib/data";
import { moveStage, markPaidManually } from "../../lib/api";
import { STAGES, STAGE_ROLE, type Order, type Stage } from "../../lib/types";
import { Page } from "../../components/Page";
import Timeline from "../../components/Timeline";
import Icon from "../../components/Icon";

const COLS: Stage[] = [...STAGES, "cancelled"];
export default function AdminOrders({ orders }: { orders: Order[] }) {
  const { t, money, pick } = useI18n(); const { user, role } = useAuth(); const { settings, products } = useData();
  const [q, setQ] = useState(""); const [openId, setOpenId] = useState<string | null>(null);
  const by = user?.email || user?.uid || "staff";
  const list = orders.filter(o => !q || (o.code + o.customerName + o.phone).toLowerCase().includes(q.toLowerCase()));
  const open = orders.find(o => o.id === openId);
  const next = (o: Order) => { const s = STAGES[STAGES.indexOf(o.stage) + 1]; return s && STAGE_ROLE[s].includes(role) ? s : null; };
  return (
    <Page className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap"><h1 className="display text-4xl">{t("orders")}</h1><input className="input !w-64" placeholder={t("search")} value={q} onChange={e => setQ(e.target.value)} /></div>
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
        {COLS.map(c => { const col = list.filter(o => o.stage === c); return (
          <div key={c} className="w-72 shrink-0 snap-start">
            <div className="flex items-center justify-between mb-2 px-1"><b className="text-sm">{t(`s_${c}` as Key)}</b><span className="text-xs bg-ink/10 rounded-full px-2">{col.length}</span></div>
            <div className="space-y-2 min-h-24 rounded-2xl bg-ink/[.04] p-2">
              {col.map(o => { const n = next(o); return (
                <div key={o.id} className="card p-3 text-sm cursor-pointer hover:border-gold transition" onClick={() => setOpenId(o.id)}>
                  <div className="flex justify-between"><b dir="ltr">{o.code}</b><b className="text-gold">{money(o.totalUSD, settings.usdToSyp)}</b></div>
                  <div className="text-slate-600 mt-1">{o.customerName}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${o.payment.status === "confirmed" ? "bg-emerald-500/20 text-emerald-300" : o.payment.status === "pending" ? "bg-yellow/20 text-yellow" : "bg-ink/10 text-slate-600"}`}>{t(`p_${o.payment.status}` as Key)}</span>
                    {n && <button className="text-xs text-gold" onClick={e => { e.stopPropagation(); moveStage(o, n, by); }}>{t(`s_${n}` as Key)} →</button>}
                  </div>
                </div>); })}
            </div>
          </div>); })}
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/70 z-50 grid place-items-center p-4" onClick={() => setOpenId(null)}>
          <div className="card p-5 w-full max-w-3xl max-h-[90vh] overflow-auto space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h2 className="display text-2xl" dir="ltr">{open.code}</h2><button onClick={() => setOpenId(null)} className="text-slate-600 p-2" aria-label="Close"><Icon n="close" /></button></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 text-sm">
                <div><b>{t("customer")}:</b> {open.customerName} · <a dir="ltr" className="text-gold" href={`tel:${open.phone}`}>{open.phone}</a></div><div><b>{t("address")}:</b> {open.address}</div>{open.designFile && <div><b>{t("attach")}:</b> {open.designFile}</div>}
                {open.items.map((i, n) => { const p = products.find(x => x.id === i.productId); return <div key={n} className="bg-ink/5 rounded-xl p-3"><b>{p ? pick(p) : i.name} × {i.qty}</b>{i.customSize && <div>{i.customSize}</div>}<div className="text-slate-600">{Object.entries(i.options).map(([k, v]) => `${k}: ${v}`).join(" • ")}</div>{i.notes && <div className="italic text-slate-700">“{i.notes}”</div>}</div>; })}
                <div className="text-lg font-bold">{money(open.totalUSD, settings.usdToSyp)} · {t(`p_${open.payment.status}` as Key)}</div>
                {open.payment.status !== "confirmed" && (role === "admin" || role === "accountant") && <button className="btn btn-ghost !py-1 text-xs" onClick={() => markPaidManually(open, by)}>{t("pay")} (cash)</button>}
              </div>
              <div className="space-y-4"><Timeline order={open} />
                <div className="flex gap-2 flex-wrap">{COLS.filter(s => s !== open.stage && STAGE_ROLE[s].includes(role)).map(s => <button key={s} className="btn btn-ghost !py-1 text-xs" onClick={() => moveStage(open, s, by)}>→ {t(`s_${s}` as Key)}</button>)}</div></div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

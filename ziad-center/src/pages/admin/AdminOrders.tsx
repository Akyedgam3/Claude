import { useState } from "react";
import { useI18n, type Key } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import { useData } from "../../lib/data";
import { moveStage, markPaidManually } from "../../lib/api";
import { STAGES, STAGE_ROLE, type Order, type Stage } from "../../lib/types";
import { Page } from "../../components/Page";
import Timeline from "../../components/Timeline";

export default function AdminOrders({ orders }: { orders: Order[] }) {
  const { t, money, pick } = useI18n(); const { user, role } = useAuth(); const { settings, products } = useData();
  const [q, setQ] = useState(""); const [filter, setFilter] = useState<Stage | "all">("all"); const [open, setOpen] = useState<string | null>(null);
  const by = user?.email || user?.uid || "staff";
  const list = orders.filter(o => (filter === "all" || o.stage === filter) && (!q || (o.code + o.customerName + o.phone).toLowerCase().includes(q.toLowerCase())));
  return (
    <Page className="space-y-4">
      <h1 className="text-3xl font-extrabold">{t("orders")}</h1>
      <div className="flex gap-2 flex-wrap items-center">
        <input className="input !w-56" placeholder={t("search")} value={q} onChange={e => setQ(e.target.value)} />
        {(["all", ...STAGES] as const).map(s => <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-full text-xs border ${filter === s ? "border-cyan text-cyan" : "border-line text-slate-400"}`}>{s === "all" ? t("all") : t(`s_${s}` as Key)}</button>)}
      </div>
      {list.map(o => (
        <div key={o.id} className="card p-4">
          <button className="w-full flex items-center gap-3 text-start flex-wrap" onClick={() => setOpen(open === o.id ? null : o.id)}>
            <b dir="ltr" className="w-40">{o.code}</b><span className="flex-1 min-w-32">{o.customerName} <span className="text-slate-500" dir="ltr">{o.phone}</span></span>
            <span className={`text-xs px-2 py-1 rounded-full ${o.payment.status === "confirmed" ? "bg-emerald-500/20 text-emerald-300" : o.payment.status === "pending" ? "bg-yellow/20 text-yellow" : "bg-white/10"}`}>{t(`p_${o.payment.status}` as Key)}</span>
            <span className="text-xs px-2 py-1 rounded-full bg-cyan/15 text-cyan">{t(`s_${o.stage}` as Key)}</span><b>{money(o.totalUSD, settings.usdToSyp)}</b>
          </button>
          {open === o.id && (
            <div className="mt-4 grid md:grid-cols-2 gap-6 border-t border-line pt-4">
              <div className="space-y-2 text-sm">
                {o.items.map((i, n) => { const p = products.find(x => x.id === i.productId); return <div key={n} className="bg-white/5 rounded-xl p-3"><b>{p ? pick(p) : i.name} × {i.qty}</b>{i.customSize && <div>📐 {i.customSize}</div>}<div className="text-slate-400">{Object.entries(i.options).map(([k, v]) => `${k}: ${v}`).join(" • ")}</div>{i.notes && <div className="italic text-slate-300">“{i.notes}”</div>}</div>; })}
                <div>📍 {o.address}</div>{o.designFile && <div>📎 {o.designFile}</div>}
                <div className="flex gap-2 flex-wrap pt-2">
                  {o.payment.status !== "confirmed" && role !== "designer" && <button className="btn btn-ghost !py-1 text-xs" onClick={() => markPaidManually(o, by)}>💵 {t("pay")} (cash)</button>}
                </div>
              </div>
              <div className="space-y-4">
                <Timeline order={o} />
                <div className="flex gap-2 flex-wrap">
                  {[...STAGES, "cancelled" as Stage].filter(s => s !== o.stage && STAGE_ROLE[s].includes(role)).map(s => <button key={s} className="btn btn-ghost !py-1 text-xs" onClick={() => moveStage(o, s, by)}>→ {t(`s_${s}` as Key)}</button>)}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </Page>
  );
}

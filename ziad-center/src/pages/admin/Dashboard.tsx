import { collection, query, orderBy } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useI18n, type Key } from "../../lib/i18n";
import { useData, useQuery } from "../../lib/data";
import { Page } from "../../components/Page";
import { ReceiptImage, PayActions } from "../../components/Receipt";
import { useAuth } from "../../lib/auth";
import { STAGES, type LedgerEntry, type Order } from "../../lib/types";

const DAY = 864e5;
export default function Dashboard({ orders }: { orders: Order[] }) {
  const { t, money, lang } = useI18n(); const { settings } = useData(); const { role } = useAuth();
  const acct = role === "admin" || role === "accountant";
  const { rows: led } = useQuery<LedgerEntry>(() => acct ? query(collection(db, "ledger"), orderBy("date", "desc")) : null, [acct]);
  const rate = settings.usdToSyp;
  const open = orders.filter(o => !["done", "cancelled"].includes(o.stage)).length;
  const pending = orders.filter(o => o.payment.status === "pending");
  const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
  const inc = led.filter(l => l.type === "income" && l.date >= +m0).reduce((a, l) => a + l.amountUSD, 0);
  const exp = led.filter(l => l.type === "expense" && l.date >= +m0).reduce((a, l) => a + l.amountUSD, 0);
  const cards: [string, string, string][] = [
    [t("openOrders"), String(open), "text-ink"],
    [t("pendingPay"), String(pending.length), pending.length ? "text-gold" : "text-ink"],
    ...(acct ? [
      [`${t("income")} (${t("month")})`, money(inc, rate), "text-emerald-700"],
      [`${t("profit")} (${t("month")})`, money(inc - exp, rate), inc - exp >= 0 ? "text-ink" : "text-rose-700"],
    ] as [string, string, string][] : []),
  ];

  // مبيعات آخر 7 أيام
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = +today - (6 - i) * DAY;
    return { d, v: led.filter(l => l.type === "income" && l.date >= d && l.date < d + DAY).reduce((a, l) => a + l.amountUSD, 0) };
  });
  const max = Math.max(1, ...days.map(x => x.v));
  const byStage = STAGES.map(s => [s, orders.filter(o => o.stage === s).length] as const);

  return (
    <Page className="space-y-6">
      <h1 className="display text-4xl">{t("dash")}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([l, v, c]) => <div key={l} className="card p-5"><div className="text-sm text-slate-600">{l}</div><div className={`text-3xl font-extrabold mt-2 ${c}`}>{v}</div></div>)}
      </div>

      <section className="space-y-3">
        <h2 className="font-extrabold text-xl">{t("pendingList")}</h2>
        {pending.length === 0 && <div className="card p-5 text-slate-600">{t("noPending")}</div>}
        <div className="grid md:grid-cols-2 gap-4">
          {pending.map(o => (
            <div key={o.id} className="card p-4 flex gap-4 ring-2 ring-[var(--color-cta)]">
              <ReceiptImage orderId={o.id} className="w-28 h-36 shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex justify-between gap-2"><b dir="ltr">{o.code}</b><b className="text-gold">{money(o.totalUSD, rate)}</b></div>
                <div className="text-sm text-slate-700 truncate">{o.customerName} · <span dir="ltr">{o.phone}</span></div>
                <PayActions order={o} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {acct && (
        <section className="card p-5">
          <h2 className="font-extrabold text-xl mb-4">{t("sales7")}</h2>
          <div className="flex items-end gap-2 h-40" dir="ltr" role="img" aria-label={t("sales7")}>
            {days.map(x => (
              <div key={x.d} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className="text-[11px] text-slate-600 tabular-nums">{x.v > 0 ? "$" + Math.round(x.v) : ""}</span>
                <div className="w-full rounded-t-lg bg-ink" style={{ height: Math.max(x.v > 0 ? 6 : 2, (x.v / max) * 100) + "%", opacity: x.v > 0 ? 1 : 0.15 }} />
                <span className="text-[11px] text-slate-600">{new Date(x.d).toLocaleDateString(lang === "ar" ? "ar-SY" : "en-GB", { weekday: "short" })}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <section className="card p-5">
          <h2 className="font-extrabold text-xl mb-3">{t("byStage")}</h2>
          <ul className="space-y-2">
            {byStage.map(([s, n]) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span className="w-24">{t(`s_${s}` as Key)}</span>
                <div className="flex-1 h-2.5 rounded-full bg-ink/10 overflow-hidden"><div className="h-full bg-ink rounded-full" style={{ width: (orders.length ? (n / orders.length) * 100 : 0) + "%" }} /></div>
                <b className="w-6 text-end tabular-nums">{n}</b>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <div className="flex justify-between mb-3"><h2 className="font-extrabold text-xl">{t("recent")}</h2><Link to="/admin/orders" className="text-gold text-sm font-bold">{t("viewAll")}</Link></div>
          <ul className="divide-y divide-line">
            {orders.slice(0, 6).map(o => (
              <li key={o.id} className="py-2 flex items-center gap-3 text-sm"><b dir="ltr" className="w-36 truncate">{o.code}</b><span className="flex-1 truncate">{o.customerName}</span><span className="text-xs px-2 py-0.5 rounded-full bg-ink/10">{t(`s_${o.stage}` as Key)}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </Page>
  );
}

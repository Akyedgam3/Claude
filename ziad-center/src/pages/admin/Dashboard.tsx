import { collection, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useI18n } from "../../lib/i18n";
import { useData, useQuery } from "../../lib/data";
import { Page } from "../../components/Page";
import type { LedgerEntry, Order } from "../../lib/types";
import { useAuth } from "../../lib/auth";

export default function Dashboard({ orders }: { orders: Order[] }) {
  const { t, money } = useI18n(); const { settings } = useData(); const { role } = useAuth();
  const acct = role === "admin" || role === "accountant";
  const { rows: led } = useQuery<LedgerEntry>(() => acct ? query(collection(db, "ledger"), orderBy("date", "desc")) : null, [acct]);
  const open = orders.filter(o => !["done", "cancelled"].includes(o.stage)).length;
  const pend = orders.filter(o => o.payment.status === "pending").length;
  const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
  const inc = led.filter(l => l.type === "income" && l.date >= +m0).reduce((a, l) => a + l.amountUSD, 0);
  const exp = led.filter(l => l.type === "expense" && l.date >= +m0).reduce((a, l) => a + l.amountUSD, 0);
  const cards: [string, string, string][] = [[t("openOrders"), String(open), "text-gold"], [t("pendingPay"), String(pend), "text-yellow"],
    ...(acct ? [[`${t("income")} (${t("month")})`, money(inc, settings.usdToSyp), "text-emerald-400"], [`${t("expenses")} (${t("month")})`, money(exp, settings.usdToSyp), "text-rose-400"]] as [string, string, string][] : [])];
  return (
    <Page className="space-y-6">
      <h1 className="text-3xl font-extrabold">{t("dash")}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(([l, v, c]) => <div key={l} className="card p-5"><div className="text-sm text-slate-400">{l}</div><div className={`text-3xl font-extrabold mt-2 ${c}`}>{v}</div></div>)}</div>
    </Page>
  );
}

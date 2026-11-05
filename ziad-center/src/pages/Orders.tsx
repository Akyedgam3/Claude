import { Link, Navigate } from "react-router-dom";
import { useI18n, type Key } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useData, useMyOrders } from "../lib/data";
import { Page } from "../components/Page";

export default function Orders() {
  const { t, money, lang } = useI18n(); const { user, ready } = useAuth(); const { settings } = useData();
  const { rows, loading } = useMyOrders(user?.uid);
  if (ready && !user) return <Navigate to="/login?next=/orders" />;
  return (
    <Page className="max-w-3xl mx-auto px-4 pt-10 space-y-3">
      <h1 className="text-3xl font-extrabold mb-4">{t("myOrders")}</h1>
      {loading && <div className="skeleton h-20" />}
      {!loading && !rows.length && <p className="text-slate-600">{t("noOrders")}</p>}
      {rows.map(o => (
        <Link key={o.id} to={`/orders/${o.id}`} className="card p-4 flex items-center gap-4 hover:border-gold transition">
          <div className="flex-1"><b dir="ltr">{o.code}</b><div className="text-xs text-slate-600">{new Date(o.createdAt).toLocaleDateString(lang === "ar" ? "ar-SY" : "en-GB")}</div></div>
          <span className="text-xs px-3 py-1 rounded-full bg-ink/10">{t(`s_${o.stage}` as Key)}</span>
          <b className="text-gold">{money(o.totalUSD, settings.usdToSyp)}</b>
        </Link>
      ))}
    </Page>
  );
}

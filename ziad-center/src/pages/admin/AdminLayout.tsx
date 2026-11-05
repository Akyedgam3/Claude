import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { useAllOrders } from "../../lib/data";
import Dashboard from "./Dashboard";
import AdminOrders from "./AdminOrders";
import Accounting from "./Accounting";
import AdminProducts from "./AdminProducts";
import AdminSettings from "./AdminSettings";
import Logo from "../../components/Logo";
import Icon from "../../components/Icon";
import { Link } from "react-router-dom";

export default function AdminLayout() {
  const { user, role, isStaff, ready } = useAuth(); const { t, lang, setLang } = useI18n();
  const { rows } = useAllOrders(isStaff);
  if (!ready) return <div className="p-10"><div className="skeleton h-40" /></div>;
  if (!user) return <Navigate to="/login?next=/admin" />;
  if (!isStaff) return <div className="p-16 text-center text-slate-600">{t("needAdmin")}</div>;
  const pending = rows.filter(o => o.payment.status === "pending").length;
  const full = role === "admin", acct = role === "admin" || role === "accountant";
  const items = [["", "dash", t("dash"), true], ["orders", "orders", t("orders"), true], ["accounting", "money", t("accounting"), acct], ["products", "box", t("products"), full], ["settings", "gear", t("settings"), full]] as const;
  const link = ({ isActive }: { isActive: boolean }) => `flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap ${isActive ? "bg-ink text-white font-bold" : "text-slate-600 hover:text-ink"}`;
  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-56 border-b md:border-b-0 md:border-e border-line p-3 md:p-4 flex md:flex-col gap-1 overflow-x-auto md:sticky md:top-0 md:h-screen">
        <Link to="/" className="hidden md:flex items-center gap-2 font-extrabold mb-4"><Logo size={32} /><span className="grad-text">{t("brand")}</span></Link>
        {items.filter(i => i[3]).map(([to, ic, label]) => <NavLink key={to} to={`/admin/${to}`} end={to === ""} className={link}><Icon n={ic} size={18} /> {label}{to === "orders" && pending > 0 && <span className="ms-auto bg-[var(--color-cta)] text-white text-xs font-bold rounded-full min-w-5 h-5 px-1.5 grid place-items-center">{pending}</span>}</NavLink>)}
        <button className="btn btn-ghost !py-1 text-xs md:mt-auto" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>{lang === "ar" ? "EN" : "عربي"}</button>
      </aside>
      <main className="flex-1 p-4 md:p-8 min-w-0">
        <Routes>
          <Route index element={<Dashboard orders={rows} />} />
          <Route path="orders" element={<AdminOrders orders={rows} />} />
          <Route path="accounting" element={acct ? <Accounting /> : <Navigate to="/admin" />} />
          <Route path="products" element={full ? <AdminProducts /> : <Navigate to="/admin" />} />
          <Route path="settings" element={full ? <AdminSettings /> : <Navigate to="/admin" />} />
        </Routes>
      </main>
    </div>
  );
}

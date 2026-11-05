import { Link, NavLink, Outlet } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { useData } from "../lib/data";
import Logo from "./Logo";
import Icon from "./Icon";

export default function Layout() {
  const { t, lang, setLang, cur, setCur } = useI18n();
  const { user, isStaff, logout } = useAuth();
  const { items } = useCart();
  const { settings } = useData();
  const link = ({ isActive }: { isActive: boolean }) => `px-3 py-1.5 rounded-full text-sm transition ${isActive ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"}`;
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-3 z-40 mx-3 mt-3 rounded-full backdrop-blur-xl bg-[#0a0a0b]/75 border border-line">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg sm:me-0 me-auto"><Logo /><span className="hidden sm:inline grad-text">{t("brand")}</span></Link>
          <nav className="flex-1 hidden sm:flex items-center gap-1 overflow-x-auto mx-2">
            <NavLink to="/" end className={link}>{t("home")}</NavLink>
            <NavLink to="/services" className={link}>{t("services")}</NavLink>
            {user && <NavLink to="/orders" className={link}>{t("track")}</NavLink>}
            {isStaff && <NavLink to="/admin" className={link}>{t("admin")}</NavLink>}
          </nav>
          <button className="btn btn-ghost !px-3 !py-1 text-sm" onClick={() => setCur(cur === "SYP" ? "USD" : "SYP")} aria-label="currency" title="Currency">{cur === "SYP" ? "ل.س" : "$"}</button>
          <button className="btn btn-ghost !px-3 !py-1 text-sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")} aria-label="Language" title="Language">{lang === "ar" ? "EN" : "عربي"}</button>
          <span className="hidden sm:block"><Link to="/cart" className="btn btn-ghost !px-3 !py-1 relative" aria-label={t("cart")}><Icon n="cart" />{items.length > 0 && <span className="absolute -top-1 -end-1 bg-magenta text-ink text-xs font-bold rounded-full w-5 h-5 grid place-items-center">{items.length}</span>}</Link></span>
          {user ? <button className="btn btn-ghost !py-1 text-sm whitespace-nowrap" onClick={logout}>{t("logout")}</button> : <Link to="/login" className="btn btn-primary !py-1 !px-4 text-sm whitespace-nowrap">{t("login")}</Link>}
        </div>
      </header>
      <main className="flex-1 pb-20 sm:pb-0"><Outlet /></main>
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0a0a0b]/95 backdrop-blur border-t border-line grid grid-cols-4 pb-[env(safe-area-inset-bottom)]" aria-label="Main">
        {([["/", "home", t("home")], ["/services", "box", t("services")], [user ? "/orders" : "/login", "orders", t("track")], ["/cart", "cart", t("cart")]] as const).map(([to, ic, label]) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 min-h-14 text-[11px] ${isActive ? "text-gold" : "text-slate-400"}`}><Icon n={ic} size={22} />{label}</NavLink>
        ))}
      </nav>
      <footer className="border-t border-line mt-20 py-8 text-center text-sm text-slate-400">
        <div className="flex justify-center gap-4 mb-2">
          {settings.phone && <a href={`tel:${settings.phone}`} className="hover:text-white">{settings.phone}</a>}
          {settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} className="hover:text-white">WhatsApp</a>}
        </div>
        © {new Date().getFullYear()} {t("brand")} — {t("footer")}
      </footer>
    </div>
  );
}

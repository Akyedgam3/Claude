import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { useData } from "../lib/data";
import Logo from "./Logo";
import Icon from "./Icon";
import Art, { hasArt } from "./Art";
import { blockOf } from "../lib/theme";

export const waLink = (num: string, text: string) => `https://wa.me/${num.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

export default function Layout() {
  const { t, lang, setLang, cur, setCur, pick } = useI18n();
  const tr = (a: string, e: string) => (lang === "ar" ? a : e);
  const { user, isStaff, logout } = useAuth();
  const { items } = useCart();
  const { settings, products } = useData();
  const nav = useNavigate();
  const [mega, setMega] = useState(false);
  const [q, setQ] = useState("");
  const quote = settings.whatsapp ? waLink(settings.whatsapp, tr("مرحباً، أريد عرض سعر من زياد سنتر", "Hello, I'd like a quote from Ziad Center")) : "#/contact";
  const link = ({ isActive }: { isActive: boolean }) => `px-2 py-1 text-[15px] whitespace-nowrap border-b-2 transition ${isActive ? "border-[var(--color-cta)] text-ink" : "border-transparent text-ink/80 hover:text-ink"}`;
  const pages: [string, string][] = [["/offers", tr("العروض", "Offers")], ["/tips", tr("نصائح الطباعة", "Print tips")], ["/shipping", tr("الشحن", "Shipping")], ["/about", tr("من نحن", "About")], ["/contact", tr("تواصل معنا", "Contact")]];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-line" onMouseLeave={() => setMega(false)}>
        <div className="max-w-6xl mx-auto px-4 h-[72px] flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg text-ink me-auto lg:me-2"><Logo size={38} /><span className="leading-tight">{t("brand")}<span className="block text-[10px] font-medium tracking-[.2em] text-slate-600">PRINTING HOUSE</span></span></Link>
          <nav className="hidden lg:flex items-center gap-4 flex-1">
            <button className={`flex items-center gap-1 px-2 py-1 text-[15px] ${mega ? "text-ink" : "text-ink/80"}`} onMouseEnter={() => setMega(true)} onClick={() => setMega(m => !m)} aria-expanded={mega}>
              {tr("المنتجات", "Products")}<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden className={`transition ${mega ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
            {pages.map(([to, l]) => <NavLink key={to} to={to} className={link}>{l}</NavLink>)}
            {isStaff && <NavLink to="/admin" className={link}>{t("admin")}</NavLink>}
          </nav>
          <form className="hidden xl:flex items-center gap-2 bg-[var(--color-paper)] rounded-full px-4 h-11 w-60 shrink-0 focus-within:ring-2 ring-[var(--color-cta)]" onSubmit={e => { e.preventDefault(); nav(`/services?q=${encodeURIComponent(q)}`); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" /></svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={tr("اسم المنتج أو الكود", "Product name or code")} aria-label={tr("بحث", "Search")} className="bg-transparent outline-none text-sm w-full" />
          </form>
          <a href={quote} target={settings.whatsapp ? "_blank" : undefined} rel="noreferrer" className="btn btn-primary !min-h-11 !py-0 text-sm whitespace-nowrap hidden sm:inline-flex">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path d="M4 20l1.3-3.900A8 8 0 1 1 8 19.500z" fill="none" stroke="currentColor" strokeWidth="1.800" strokeLinejoin="round" /></svg>{tr("اطلب عرض سعر", "Get a quote")}
          </a>
          <div className="flex items-center gap-1">
            <button className="text-sm px-2 h-11 rounded-full hover:bg-ink/5" onClick={() => setLang(lang === "ar" ? "en" : "ar")} aria-label="Language">{lang === "ar" ? "EN" : "ع"}</button>
            <button className="text-sm px-2 h-11 rounded-full hover:bg-ink/5" onClick={() => setCur(cur === "SYP" ? "USD" : "SYP")} aria-label="Currency">{cur === "SYP" ? "ل.س" : "$"}</button>
            <Link to="/cart" className="hidden sm:grid relative place-items-center w-11 h-11 rounded-full hover:bg-ink/5" aria-label={t("cart")}><Icon n="cart" />{items.length > 0 && <span className="absolute top-0 end-0 bg-[var(--color-cta)] text-white text-[10px] font-bold rounded-full w-5 h-5 grid place-items-center">{items.length}</span>}</Link>
            {user ? <button className="hidden sm:grid place-items-center w-11 h-11 rounded-full hover:bg-ink/5" onClick={logout} title={t("logout")} aria-label={t("logout")}><Icon n="user" /></button>
              : <Link to="/login" className="grid place-items-center w-11 h-11 rounded-full hover:bg-ink/5" aria-label={t("login")}><Icon n="user" /></Link>}
          </div>
        </div>
        {/* قائمة المنتجات المنسدلة */}
        <AnimatePresence>
          {mega && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .18 }} className="absolute inset-x-0 top-full bg-white border-b border-line shadow-xl">
              <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-4 gap-4">
                {products.map(p => (
                  <Link key={p.id} to={`/services/${p.id}`} onClick={() => setMega(false)} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-[var(--color-paper)]">
                    <span className="w-16 h-12 rounded-xl grid place-items-center overflow-hidden" style={{ background: blockOf(p.id) }}>{p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : hasArt(p.id) ? <Art id={p.id} className="w-full h-full" /> : <Icon n="box" />}</span>
                    <span><b className="text-sm text-ink block">{pick(p)}</b><span className="text-xs text-slate-600 line-clamp-1">{pick({ ar: p.descAr, en: p.descEn })}</span></span>
                  </Link>
                ))}
                <Link to="/services" onClick={() => setMega(false)} className="col-span-4 text-center text-sm font-bold text-[var(--color-cta)] pt-2 border-t border-line">{tr("كل المنتجات", "All products")} {lang === "ar" ? "←" : "→"}</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 pb-20 sm:pb-0"><Outlet /></main>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-line grid grid-cols-4 pb-[env(safe-area-inset-bottom)]" aria-label="Main">
        {([["/", "home", t("home")], ["/services", "box", t("services")], [user ? "/orders" : "/login", "orders", t("track")], ["/cart", "cart", t("cart")]] as const).map(([to, ic, label]) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 min-h-14 text-[11px] ${isActive ? "text-[var(--color-cta)]" : "text-slate-600"}`}><Icon n={ic} size={22} />{label}</NavLink>
        ))}
      </nav>

      {/* الفوتر */}
      <footer className="relative mt-24 bg-ink text-white/80">
        <svg className="absolute -top-px inset-x-0 w-full h-10 text-[var(--color-paper)]" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden>
          <path d="M0 0h1440v10C1100 34 700 0 360 22 200 32 80 26 0 18z" fill="currentColor" />
          <path d="M0 18c80 8 200 14 360 4C700 0 1100 34 1440 10" fill="none" stroke="var(--color-cta)" strokeWidth="3" />
        </svg>
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-8">
          <div className="grid lg:grid-cols-2 gap-10 pb-10 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3 text-white"><Logo size={48} /><span className="text-2xl font-extrabold">{t("brand")}<span className="block text-[11px] font-medium tracking-[.25em] text-white/60">PRINTING HOUSE</span></span></div>
              <p className="mt-5 max-w-md leading-7">{tr("مطبعة متكاملة للمطبوعات التجارية والتغليف والهدايا المطبوعة. صمّم واطلب وتابع طلبك أونلاين حتى يصلك.", "A full-service print house for commercial print, packaging and printed gifts. Design, order and track online until it reaches you.")}</p>
              <div className="mt-5 flex gap-2">
                {([["facebook", "M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v6h4v-6h3l1-4h-4V8z"], ["instagram", "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.500-1.500v.01"], ["tiktok", "M14 3v11a3 3 0 1 1-3-3M14 3c1 3 3 4 6 4"], ["telegram", "M3 11l18-7-3 16-6-5-3 3v-5l9-7"]] as const)
                  .filter(([k]) => settings[k]).map(([k, d]) => <a key={k} href={settings[k]} target="_blank" rel="noreferrer" aria-label={k} className="w-10 h-10 rounded-full bg-white/10 grid place-items-center hover:bg-white/20 text-white"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path d={d} fill="none" stroke="currentColor" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round" /></svg></a>)}
              </div>
              {settings.address && <p className="mt-4 text-sm text-white/60">{settings.address}</p>}
            </div>
            <div>
              <div className="text-sm text-white/60 mb-3">{tr("تواصل معنا", "Contact us")}</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <a href={settings.whatsapp ? waLink(settings.whatsapp, "") : "#/contact"} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"><b className="text-white">WhatsApp</b><div className="text-xs text-white/60">{tr("للطلبات وعروض الأسعار", "Orders & quotes")}</div><div className="mt-2 font-bold text-white" dir="ltr">{settings.whatsapp || "—"}</div></a>
                <a href={settings.phone ? `tel:${settings.phone}` : "#/contact"} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"><b className="text-white">{tr("الهاتف", "Phone")}</b><div className="text-xs text-white/60">{tr("خدمة العملاء", "Customer service")}</div><div className="mt-2 font-bold text-white" dir="ltr">{settings.phone || "—"}</div></a>
                {settings.email && <a href={`mailto:${settings.email}`} className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"><b className="text-white">{t("email")}</b><div className="text-xs text-white/60">{tr("للعروض والطلبات", "Offers & orders")}</div><div className="mt-2 font-bold text-white" dir="ltr">{settings.email}</div></a>}
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 py-10 text-sm">
            <div><div className="text-white/50 mb-3">{tr("الأقسام", "Categories")}</div><ul className="space-y-2.5">{products.slice(0, 6).map(p => <li key={p.id}><Link to={`/services/${p.id}`} className="hover:text-white">{pick(p)}</Link></li>)}</ul></div>
            <div><div className="text-white/50 mb-3">{tr("الشركة", "Company")}</div><ul className="space-y-2.5">{pages.map(([to, l]) => <li key={to}><Link to={to} className="hover:text-white">{l}</Link></li>)}</ul></div>
            <div><div className="text-white/50 mb-3">{tr("حسابي", "My account")}</div><ul className="space-y-2.5"><li><Link to="/orders" className="hover:text-white">{t("track")}</Link></li><li><Link to="/cart" className="hover:text-white">{t("cart")}</Link></li><li><Link to="/login" className="hover:text-white">{t("login")}</Link></li></ul></div>
          </div>
          <div className="pt-6 border-t border-white/10 flex flex-wrap justify-between gap-3 text-xs text-white/60">
            <span>© {new Date().getFullYear()} {t("brand")}. {t("footer")}.</span>
            <span className="flex gap-4"><Link to="/about" className="hover:text-white">{tr("سياسة الخصوصية", "Privacy")}</Link><Link to="/shipping" className="hover:text-white">{tr("سياسة الإرجاع", "Returns")}</Link></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useEffect, useState } from "react";
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
import { useExtras } from "../lib/extras";

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
  const [acct, setAcct] = useState(false);
  const [menu, setMenu] = useState(false);
  const { favs } = useExtras();
  const [top, setTop] = useState(false);
  useEffect(() => { const f = () => setTop(window.scrollY > 900); addEventListener("scroll", f, { passive: true }); return () => removeEventListener("scroll", f); }, []);
  const quote = settings.whatsapp ? waLink(settings.whatsapp, tr("مرحباً، أريد عرض سعر من زياد سنتر", "Hello, I'd like a quote from Ziad Center")) : "#/contact";
  const link = ({ isActive }: { isActive: boolean }) => `grid place-items-center h-[84px] text-[15px] whitespace-nowrap border-b-2 transition ${isActive ? "border-[var(--color-cta)] text-ink" : "border-transparent text-ink hover:text-[var(--color-cta)]"}`;
  const pages: [string, string][] = [["/offers", tr("العروض", "Offers")], ["/tips", tr("نصائح الطباعة", "Print tips")], ["/markets", tr("الأسواق", "Markets")], ["/shipping", tr("الشحن", "Shipping")], ["/about", tr("من نحن", "About")], ["/contact", tr("تواصل معنا", "Contact")]];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-line" onMouseLeave={() => setMega(false)}>
        <div className="max-w-[1320px] mx-auto px-4 lg:px-8 h-[84px] flex items-center gap-3 xl:gap-6">
          <Link to="/" className="flex items-center gap-2 text-ink shrink-0 me-auto xl:me-0" aria-label={t("brand")}>
            <Logo size={40} /><span className="leading-none whitespace-nowrap"><b className="text-xl font-extrabold">{t("brand")}</b><span className="block mt-1 text-[9px] font-medium tracking-[.28em] text-slate-600">PRINTING HOUSE</span></span>
          </Link>
          <nav className="hidden xl:flex items-center gap-5 2xl:gap-7 shrink-0">
            <button className={`flex items-center gap-1.5 text-[15px] h-[84px] border-b-2 ${mega ? "border-[var(--color-cta)] text-ink" : "border-transparent text-ink"}`} onMouseEnter={() => setMega(true)} onClick={() => setMega(m => !m)} aria-expanded={mega}>
              {tr("المنتجات", "Products")}<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden className={`transition ${mega ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
            {pages.map(([to, l]) => <NavLink key={to} to={to} className={link}>{l}</NavLink>)}
            {isStaff && <NavLink to="/admin" className={link}>{t("admin")}</NavLink>}
          </nav>
          <form className="hidden 2xl:flex flex-1 min-w-[200px] max-w-[380px] items-center gap-2 bg-[#f3f1ec] rounded-full px-5 h-12 focus-within:ring-2 ring-[var(--color-cta)]" onSubmit={e => { e.preventDefault(); nav(`/services?q=${encodeURIComponent(q)}`); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="text-slate-600 shrink-0"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" /></svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={tr("اسم المنتج أو الكود", "Product name or code")} aria-label={tr("بحث", "Search")} className="bg-transparent outline-none text-[15px] w-full placeholder:text-slate-500" />
          </form>
          <span className="hidden sm:block shrink-0"><a href={quote} target={settings.whatsapp ? "_blank" : undefined} rel="noreferrer" className="btn btn-primary !min-h-12 !py-0 !px-6 text-[15px] whitespace-nowrap">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path d="M4 20l1.300-3.900A8 8 0 1 1 8 19.500z" fill="none" stroke="currentColor" strokeWidth="1.800" strokeLinejoin="round" /><path d="M9 9.500c.300 2 2.500 4.200 4.500 4.500l1-1.200 1.800.8c-.200 1.200-1.200 1.900-2.300 1.800-3-.400-5.700-3.100-6.100-6.100-.100-1.100.6-2.100 1.800-2.300l.8 1.800z" fill="currentColor" /></svg>{tr("اطلب عرض سعر", "Get a quote")}
          </a></span>
          <div className="flex items-center gap-1 shrink-0">
            <button className="xl:hidden grid place-items-center w-11 h-11 rounded-full hover:bg-ink/5" onClick={() => setMenu(m => !m)} aria-expanded={menu} aria-label={tr("القائمة", "Menu")}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden><path d={menu ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            <button className="flex items-center gap-1.5 px-2 h-11 rounded-full hover:bg-ink/5 text-ink" onClick={() => setLang(lang === "ar" ? "en" : "ar")} aria-label={tr("تبديل اللغة", "Switch language")}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.800" /><path d="M3 12h18M12 3c3 3.500 3 14.500 0 18M12 3c-3 3.500-3 14.500 0 18" fill="none" stroke="currentColor" strokeWidth="1.500" /></svg>
              <span className="text-[15px]">{lang === "ar" ? "EN" : "ع"}</span>
            </button>
            <Link to="/cart" className="relative grid place-items-center w-11 h-11 rounded-full hover:bg-ink/5" aria-label={t("cart")}><Icon n="cart" />{items.length > 0 && <span className="absolute top-0 end-0 bg-[var(--color-cta)] text-white text-[10px] font-bold rounded-full w-5 h-5 grid place-items-center">{items.length}</span>}</Link>
            {/* قائمة الحساب: المفضلة، الطلبات، العملة، الدخول/الخروج */}
            <div className="relative hidden sm:block">
              <button className="relative grid place-items-center w-11 h-11 rounded-full hover:bg-ink/5" onClick={() => setAcct(a => !a)} aria-expanded={acct} aria-label={tr("حسابي", "My account")}><Icon n="user" />{favs.length > 0 && <span className="absolute top-1 end-1 w-2.5 h-2.5 rounded-full bg-rose-600" />}</button>
              <AnimatePresence>{acct && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute end-0 top-12 w-56 bg-white border border-line rounded-2xl shadow-xl p-2 text-sm" onMouseLeave={() => setAcct(false)}>
                  {user ? <div className="px-3 py-2 text-xs text-slate-600 truncate">{user.email}</div> : <Link to="/login" onClick={() => setAcct(false)} className="block px-3 py-2.5 rounded-xl hover:bg-ink/5 font-bold">{t("login")}</Link>}
                  <Link to="/orders" onClick={() => setAcct(false)} className="block px-3 py-2.5 rounded-xl hover:bg-ink/5">{t("track")}</Link>
                  <Link to="/favorites" onClick={() => setAcct(false)} className="flex justify-between px-3 py-2.5 rounded-xl hover:bg-ink/5">{tr("المفضلة", "Favourites")}{favs.length > 0 && <b className="text-rose-600">{favs.length}</b>}</Link>
                  <button onClick={() => setCur(cur === "SYP" ? "USD" : "SYP")} className="w-full flex justify-between px-3 py-2.5 rounded-xl hover:bg-ink/5">{tr("العملة", "Currency")}<b>{cur === "SYP" ? "ل.س" : "$"}</b></button>
                  {user && <button onClick={() => { setAcct(false); logout(); }} className="w-full text-start px-3 py-2.5 rounded-xl hover:bg-ink/5 text-rose-700">{t("logout")}</button>}
                </motion.div>)}
              </AnimatePresence>
            </div>
          </div>
        </div>
        {/* قائمة الشاشات الأصغر */}
        <AnimatePresence>{menu && (
          <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="xl:hidden absolute inset-x-0 top-full bg-white border-b border-line shadow-xl" aria-label={tr("القائمة", "Menu")}>
            <div className="max-w-[1320px] mx-auto px-4 py-4 grid sm:grid-cols-2 gap-1">
              <form className="sm:col-span-2 flex items-center gap-2 bg-[#f3f1ec] rounded-full px-5 h-12 mb-2" onSubmit={e => { e.preventDefault(); setMenu(false); nav(`/services?q=${encodeURIComponent(q)}`); }}>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder={tr("اسم المنتج أو الكود", "Product name or code")} aria-label={tr("بحث", "Search")} className="bg-transparent outline-none text-[15px] w-full" />
              </form>
              {([["/services", tr("المنتجات", "Products")], ...pages] as [string, string][]).map(([to, l]) => <Link key={to} to={to} onClick={() => setMenu(false)} className="px-4 py-3 rounded-xl hover:bg-ink/5 text-ink font-medium">{l}</Link>)}
              {isStaff && <Link to="/admin" onClick={() => setMenu(false)} className="px-4 py-3 rounded-xl hover:bg-ink/5 text-ink font-medium">{t("admin")}</Link>}
              <a href={quote} target="_blank" rel="noreferrer" className="sm:hidden btn btn-primary mt-2">{tr("اطلب عرض سعر", "Get a quote")}</a>
            </div>
          </motion.nav>)}
        </AnimatePresence>
        {/* قائمة المنتجات المنسدلة */}
        <AnimatePresence>
          {mega && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .18 }} className="absolute inset-x-0 top-full bg-white border-b border-line shadow-xl">
              <div className="max-w-[1320px] mx-auto px-4 lg:px-8 py-6 grid grid-cols-4 gap-4">
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

      {/* أزرار عائمة: واتساب + للأعلى */}
      <div className="fixed z-40 end-4 bottom-24 sm:bottom-6 flex flex-col gap-3">
        <AnimatePresence>{top && <motion.button initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .8 }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label={tr("للأعلى", "Back to top")} className="w-12 h-12 rounded-full bg-white border border-line shadow-lg grid place-items-center text-ink"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path d="M12 19V5m-6 6 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" /></svg></motion.button>}</AnimatePresence>
        {settings.whatsapp && <a href={waLink(settings.whatsapp, tr("مرحباً زياد سنتر", "Hello Ziad Center"))} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="relative w-14 h-14 rounded-full bg-[#25d366] text-white shadow-xl grid place-items-center hover:scale-105 transition"><span className="absolute inset-0 rounded-full bg-[#25d366] animate-ping opacity-25" aria-hidden /><svg width="28" height="28" viewBox="0 0 24 24" aria-hidden><path d="M4 20l1.300-3.900A8 8 0 1 1 8 19.500z" fill="none" stroke="currentColor" strokeWidth="1.800" strokeLinejoin="round" /><path d="M9 9.500c.300 2 2.500 4.200 4.500 4.500l1-1.200 1.800.8c-.200 1.200-1.200 1.900-2.300 1.800-3-.400-5.700-3.100-6.100-6.100-.100-1.100.6-2.100 1.800-2.300l.8 1.800z" fill="currentColor" /></svg></a>}
      </div>

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
            <div><div className="text-white/50 mb-3">{tr("حسابي", "My account")}</div><ul className="space-y-2.5"><li><Link to="/orders" className="hover:text-white">{t("track")}</Link></li><li><Link to="/cart" className="hover:text-white">{t("cart")}</Link></li><li><Link to="/favorites" className="hover:text-white">{tr("المفضلة", "Favourites")}</Link></li><li><Link to="/login" className="hover:text-white">{t("login")}</Link></li></ul></div>
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

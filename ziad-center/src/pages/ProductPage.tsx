import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { useCart } from "../lib/cart";
import { useExtras, Heart } from "../lib/extras";
import { unitPrice } from "../lib/catalog";
import { Page } from "../components/Page";
import ProductCard from "../components/ProductCard";
import Art, { hasArt } from "../components/Art";
import Icon from "../components/Icon";
import { blockOf } from "../lib/theme";
import { waLink } from "../components/Layout";

const TIERS = [1, 100, 500, 1000];

export default function ProductPage() {
  const { id } = useParams(); const nav = useNavigate();
  const { t, pick, money, lang } = useI18n(); const { products, settings } = useData(); const cart = useCart();
  const { pushRecent, recent, toast } = useExtras();
  const tr = (a: string, e: string) => (lang === "ar" ? a : e);
  const p = products.find(x => x.id === id);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(p?.minQty ?? 1);
  const [notes, setNotes] = useState(""); const [size, setSize] = useState("");
  useEffect(() => { if (p) { pushRecent(p.id); setQty(p.minQty); setSel({}); window.scrollTo(0, 0); } }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const full = useMemo(() => p ? Object.fromEntries(p.options.map(g => [g.key, sel[g.key] ?? g.choices[0].id])) : {}, [p, sel]);
  if (!p) return <div className="p-10"><div className="skeleton h-80 max-w-5xl mx-auto" /></div>;

  const { unit, disc, sale } = unitPrice(p, full, qty);
  const total = Math.round(unit * qty * 100) / 100;
  const code = p.code || `ZC-${p.id.slice(0, 6).toUpperCase()}`;
  const optText = p.options.map(g => `${pick(g)}: ${pick(g.choices.find(c => c.id === full[g.key]) || g.choices[0])}`).join("، ");
  const quote = settings.whatsapp ? waLink(settings.whatsapp, tr(`مرحباً، أريد عرض سعر:\n${pick(p)} (${code})\nالكمية: ${qty}\n${optText}${size ? `\nالمقاس: ${size}` : ""}`, `Hello, I'd like a quote:\n${pick(p)} (${code})\nQty: ${qty}\n${optText}${size ? `\nSize: ${size}` : ""}`)) : "#/contact";
  const tiers = TIERS.filter(q => q >= p.minQty || q === 1).map(q => Math.max(q, p.minQty)).filter((q, i, a) => a.indexOf(q) === i);
  const related = products.filter(x => x.id !== p.id).slice(0, 4);
  const seen = recent.filter(r => r !== p.id).map(r => products.find(x => x.id === r)).filter(Boolean).slice(0, 4) as typeof products;

  const add = (go: boolean) => {
    cart.add({ productId: p.id, name: p.ar + " / " + p.en, options: full, qty, unitUSD: unit, totalUSD: total, notes, customSize: size });
    toast(tr("أُضيف إلى السلة", "Added to cart"));
    if (go) nav("/cart");
  };
  const share = async () => {
    const url = location.href;
    try { if (navigator.share) await navigator.share({ title: pick(p), url }); else { await navigator.clipboard.writeText(url); toast(tr("تم نسخ الرابط", "Link copied")); } } catch { /* أُلغيت المشاركة */ }
  };

  return (
    <Page className="max-w-6xl mx-auto px-4 pt-8">
      <nav className="text-sm text-slate-600 mb-6 flex gap-2" aria-label="breadcrumb"><Link to="/" className="hover:text-ink">{t("home")}</Link>/<Link to="/services" className="hover:text-ink">{tr("كل المنتجات", "All products")}</Link>/<span className="text-ink">{pick(p)}</span></nav>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="md:sticky md:top-24 self-start">
          <motion.div initial={{ scale: .94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative rounded-[1.8rem] border border-line aspect-square grid place-items-center overflow-hidden" style={{ background: p.image ? "#f5f4f1" : blockOf(p.id) }}>
            <motion.div className="w-full h-full grid place-items-center" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}>
              {p.image ? <img src={p.image} alt={pick(p)} className="w-full h-full object-cover" /> : hasArt(p.id) ? <Art id={p.id} className="w-full h-full p-8" /> : <Icon n="box" size={140} className="text-ink/70" />}
            </motion.div>
            <Heart id={p.id} className="absolute top-4 start-4" />
            <span className="absolute bottom-4 start-4 bg-white/90 rounded-full px-3 py-1.5 text-xs font-bold text-ink" dir="ltr">{code}</span>
          </motion.div>
          {/* خصومات الكميات */}
          <div className="mt-5 rounded-[1.4rem] border border-line bg-white overflow-hidden">
            <div className="px-5 py-3 bg-ink text-white text-sm font-bold">{tr("السعر حسب الكمية (للخيارات المحددة)", "Price by quantity (selected options)")}</div>
            {tiers.map(q => { const u = unitPrice(p, full, q).unit; return (
              <button key={q} onClick={() => setQty(q)} className={`w-full flex justify-between px-5 py-3 text-sm border-t border-line hover:bg-[var(--color-paper)] ${qty === q ? "bg-[var(--color-paper)] font-bold" : ""}`}>
                <span>{q.toLocaleString(lang === "ar" ? "ar-SY" : "en-US")} {tr("قطعة", "pcs")}</span><span>{money(u, settings.usdToSyp)} / {tr("قطعة", "pc")}</span><span className="text-ink font-bold">{money(u * q, settings.usdToSyp)}</span>
              </button>); })}
          </div>
        </div>

        <div className="space-y-5">
          <div><span className="text-xs font-bold text-[var(--color-cta)]" dir="ltr">{code}</span><h1 className="display text-3xl md:text-4xl text-ink mt-1">{pick(p)}</h1><p className="text-slate-700 mt-2">{pick({ ar: p.descAr, en: p.descEn })}</p></div>
          {p.options.map(g => (
            <div key={g.key}><span className="label">{pick(g)}</span>
              <div className="flex flex-wrap gap-2">
                {g.choices.map(c => <button key={c.id} onClick={() => setSel({ ...sel, [g.key]: c.id })} aria-pressed={full[g.key] === c.id} className={`px-4 h-11 rounded-full border text-sm transition ${full[g.key] === c.id ? "border-ink bg-ink text-white font-bold" : "border-line bg-white hover:border-ink"}`}>{pick(c)}</button>)}
              </div>
            </div>
          ))}
          <div><label className="label" htmlFor="qty">{t("qty")} {p.minQty > 1 && `(${tr("الحد الأدنى", "min")} ${p.minQty})`}</label>
            <div className="flex items-center gap-2">
              <button className="w-11 h-11 rounded-full border border-line bg-white text-xl" aria-label="-" onClick={() => setQty(q => Math.max(p.minQty, q - (q > 100 ? 50 : 1)))}>−</button>
              <input id="qty" className="input text-center !w-32" type="number" min={p.minQty} value={qty} onChange={e => setQty(Math.max(p.minQty, +e.target.value || p.minQty))} />
              <button className="w-11 h-11 rounded-full border border-line bg-white text-xl" aria-label="+" onClick={() => setQty(q => q + (q >= 100 ? 50 : 1))}>+</button>
            </div></div>
          <div><label className="label" htmlFor="size">{t("customSize")}</label><input id="size" className="input" value={size} onChange={e => setSize(e.target.value)} placeholder="90×50 cm" /></div>
          <div><label className="label" htmlFor="notes">{t("notes")}</label><textarea id="notes" className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></div>
          <div className="rounded-[1.4rem] border border-line bg-white p-5 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-700"><span>{t("unit")}</span><span>{money(unit, settings.usdToSyp)}</span></div>
            {sale > 0 && <div className="flex justify-between text-sm text-[var(--color-cta)]"><span className="flex items-center gap-1"><Icon n="bolt" size={16} /> {t("flash")}</span><span>-{Math.round(sale * 100)}%</span></div>}
            {disc > 0 && <div className="flex justify-between text-sm text-emerald-700"><span>{t("discount")}</span><span>-{disc * 100}%</span></div>}
            <div className="flex justify-between text-2xl font-extrabold pt-2"><span>{t("total")}</span><motion.span key={total} initial={{ scale: 1.15, color: "#3263db" }} animate={{ scale: 1, color: "#0d244c" }}>{money(total, settings.usdToSyp)}</motion.span></div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-primary flex-1" onClick={() => add(true)}>{t("orderNow")}</button>
            <button className="btn btn-ghost" onClick={() => add(false)}><Icon n="cart" size={18} />{t("addCart")}</button>
          </div>
          <div className="flex gap-3 flex-wrap">
            <a href={quote} target="_blank" rel="noreferrer" className="btn flex-1 border border-[#25d366] text-[#128c4a] hover:bg-[#25d366]/10">{tr("اطلب عرض سعر عبر واتساب", "Quote via WhatsApp")}</a>
            <button className="btn btn-ghost" onClick={share} aria-label={tr("مشاركة", "Share")}>{tr("مشاركة", "Share")}</button>
          </div>
          <ul className="grid grid-cols-3 gap-2 text-center text-xs text-slate-700 pt-2">
            {[tr("نموذج قبل الطباعة", "Proof before print"), tr("دفع عبر شام كاش", "Sham Cash payment"), tr("تتبّع حتى التسليم", "Tracked delivery")].map(x => <li key={x} className="rounded-2xl bg-[var(--color-paper)] border border-line py-3 px-2">{x}</li>)}
          </ul>
        </div>
      </div>

      {related.length > 0 && <section className="mt-20"><h2 className="display text-2xl md:text-3xl text-ink mb-6">{tr("منتجات قد تعجبك", "You may also like")}</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{related.map(x => <ProductCard key={x.id} p={x} />)}</div></section>}
      {seen.length > 0 && <section className="mt-16"><h2 className="display text-2xl md:text-3xl text-ink mb-6">{tr("شاهدتها مؤخراً", "Recently viewed")}</h2><div className="grid grid-cols-2 lg:grid-cols-4 gap-6">{seen.map(x => <ProductCard key={x.id} p={x} />)}</div></section>}
    </Page>
  );
}

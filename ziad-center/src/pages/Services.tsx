import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { unitPrice } from "../lib/catalog";
import { Page, Reveal } from "../components/Page";
import ProductCard from "../components/ProductCard";
import Art, { hasArt } from "../components/Art";
import Icon from "../components/Icon";
import { waLink } from "../components/Layout";

const PAGE = 12;

export default function Services() {
  const { t, lang, pick } = useI18n(); const { products, settings } = useData();
  const tr = (a: string, e: string) => (lang === "ar" ? a : e);
  const [sp, setSp] = useSearchParams(); const q = (sp.get("q") || "").trim().toLowerCase();
  const [sort, setSort] = useState<"def" | "asc" | "desc" | "name">("def");
  const [shown, setShown] = useState(PAGE);
  const [hover, setHover] = useState<string | null>(null);

  const price = (p: (typeof products)[number]) => unitPrice(p, Object.fromEntries(p.options.map(g => [g.key, g.choices[0]?.id])), p.minQty).unit * Math.max(1, p.minQty);
  const list = useMemo(() => {
    let l = q ? products.filter(p => [p.ar, p.en, p.descAr, p.descEn, p.id, p.code || ""].join(" ").toLowerCase().includes(q)) : [...products];
    if (sort === "asc") l.sort((a, b) => price(a) - price(b));
    if (sort === "desc") l.sort((a, b) => price(b) - price(a));
    if (sort === "name") l.sort((a, b) => pick(a).localeCompare(pick(b), lang));
    return l;
  }, [products, q, sort, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const shelf = products.filter(p => hasArt(p.id) || p.image).slice(0, 8);
  const quote = settings.whatsapp ? waLink(settings.whatsapp, tr("مرحباً، أريد عرض سعر", "Hello, I'd like a quote")) : "#/contact";

  return (
    <Page className="max-w-6xl mx-auto px-4 pt-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div><h1 className="display text-4xl md:text-5xl text-ink">{tr("كل المنتجات", "All products")}</h1>
          <p className="mt-4 text-slate-700 max-w-xl leading-8">{tr("منتجات قابلة للطباعة بشعارك، ولكل منتج سعر واضح وكود. أرسل الكود والكمية ونرد عليك بعرض السعر.", "Printable products with your logo, each with a clear price and code. Send the code and quantity for a quote.")}</p></div>
        <a href={quote} target="_blank" rel="noreferrer" className="btn btn-primary">{tr("اطلب عرض سعر", "Get a quote")}</a>
      </div>

      {/* رف الأقسام */}
      <section className="mt-10 rounded-[2rem] bg-gradient-to-b from-[#f2f0eb] to-[#e8e5df] p-6 md:p-8 overflow-hidden">
        <h2 className="font-extrabold text-xl text-ink">{tr("تصفّح حسب القسم", "Browse by category")}</h2>
        <div className="relative mt-6">
          <div className="flex items-end justify-start md:justify-center gap-1 sm:gap-3 h-48 sm:h-64 overflow-x-auto px-2" style={{ perspective: 900 }}>
            {shelf.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07, type: "spring", stiffness: 160, damping: 16 }} className="shrink-0">
                <Link to={`/services/${p.id}`} aria-label={pick(p)} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(p.id)} onBlur={() => setHover(null)}
                  className="group relative block w-24 sm:w-32 h-32 sm:h-44 origin-bottom transition-transform duration-300 hover:-translate-y-4 focus-visible:-translate-y-4" style={{ transform: `rotateY(${(i - (shelf.length - 1) / 2) * -4}deg)` }}>
                  {p.image ? <img src={p.image} alt="" className="absolute inset-x-0 bottom-0 w-full h-full object-contain drop-shadow-xl" /> : <Art id={p.id} className="absolute inset-x-0 bottom-0 w-full h-full drop-shadow-xl" />}
                  <span className="absolute bottom-0 inset-x-4 h-2 rounded-full bg-black/25 blur-md -z-10 group-hover:opacity-40 transition" />
                </Link>
              </motion.div>
            ))}
          </div>
          {/* لوح الرف */}
          <div className="relative h-4 rounded-full bg-gradient-to-b from-white to-[#d9d5cc] shadow-[0_10px_20px_-10px_rgba(13,36,76,.35)]" />
        </div>
        <div className="text-center mt-6 min-h-12" aria-live="polite">
          <b className="text-lg text-ink">{hover ? pick(products.find(p => p.id === hover)!) : tr("اختر قطعة من الرف", "Pick an item from the shelf")}</b>
          <p className="text-sm text-slate-600 mt-1">{tr("كل قطعة تفتح قسماً من أقسام المتجر", "Each item opens a store category")}</p>
        </div>
      </section>

      {/* الأدوات */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-slate-700">{tr(`عرض ${Math.min(shown, list.length)} من ${list.length} منتجاً`, `Showing ${Math.min(shown, list.length)} of ${list.length} products`)}</span>
        <div className="flex gap-2 flex-wrap">
          <label className="flex items-center gap-2 border border-line rounded-full px-4 h-11 bg-white w-64"><Icon n="box" size={16} /><input className="outline-none bg-transparent text-sm w-full" placeholder={tr("ابحث في المنتجات", "Search products")} aria-label={tr("بحث", "Search")} value={sp.get("q") || ""} onChange={e => { setShown(PAGE); setSp(e.target.value ? { q: e.target.value } : {}); }} /></label>
          <select className="border border-line rounded-full px-4 h-11 bg-white text-sm" aria-label={tr("الترتيب", "Sort")} value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
            <option value="def">{tr("الترتيب الافتراضي", "Default order")}</option><option value="asc">{tr("السعر: من الأقل", "Price: low to high")}</option><option value="desc">{tr("السعر: من الأعلى", "Price: high to low")}</option><option value="name">{tr("الاسم", "Name")}</option>
          </select>
        </div>
      </div>

      {list.length === 0 && <div className="card p-8 text-center text-slate-600 mt-6">{tr("لا توجد نتائج", "No results")}</div>}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {list.slice(0, shown).map((p, i) => <Reveal key={p.id} delay={(i % 4) * .05}><ProductCard p={p} /></Reveal>)}
      </div>
      {shown < list.length && <div className="text-center mt-10"><button className="btn btn-ghost" onClick={() => setShown(s => s + PAGE)}>{tr("تصفّح المزيد من المنتجات", "Load more products")}</button></div>}
      <p className="sr-only">{t("services")}</p>
    </Page>
  );
}

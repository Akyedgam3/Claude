import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { unitPrice } from "../lib/catalog";
import { Page, Reveal } from "../components/Page";
import ProductCard from "../components/ProductCard";
import ShelfItem from "../components/ShelfArt";
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
  // قطع الرف (رسومات أصلية) وكل قطعة تفتح قسمها
  const shelf = [
    { k: "bottle", ar: "مطرات وأكواب", en: "Bottles & mugs", to: "/services/mugs" },
    { k: "folder", ar: "ملفات ومطبوعات ورقية", en: "Folders & paper print", to: "/services/flyers" },
    { k: "notebook", ar: "دفاتر وأجندات", en: "Notebooks & agendas", to: "/services?q=notebook" },
    { k: "pencils", ar: "أقلام وقرطاسية", en: "Pens & stationery", to: "/services?q=pen" },
    { k: "box", ar: "علب وتغليف", en: "Boxes & packaging", to: "/services/boxes" },
    { k: "flag", ar: "أعلام ولوحات", en: "Flags & signs", to: "/services/banners" },
    { k: "cap", ar: "ألبسة مطبوعة", en: "Printed apparel", to: "/services/mugs" },
    { k: "trophy", ar: "دروع وتكريم", en: "Trophies & awards", to: "/services?q=award" },
  ] as const;
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
          <div className="flex items-end justify-start md:justify-center gap-2 sm:gap-3 lg:gap-4 h-48 sm:h-60 lg:h-64 overflow-x-auto px-2">
            {shelf.map((x, i) => (
              <motion.div key={x.k} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07, type: "spring", stiffness: 160, damping: 16 }} className="shrink-0">
                <Link to={x.to} aria-label={tr(x.ar, x.en)} onMouseEnter={() => setHover(x.k)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(x.k)} onBlur={() => setHover(null)}
                  className="group relative block w-20 sm:w-24 lg:w-[7.5rem] h-32 sm:h-40 lg:h-48 origin-bottom transition-transform duration-300 hover:-translate-y-4 focus-visible:-translate-y-4">
                  <ShelfItem k={x.k} className="absolute inset-x-0 bottom-0 w-full h-full drop-shadow-[0_14px_14px_rgba(13,36,76,.28)]" />
                  <span className="absolute -bottom-1 inset-x-3 h-2 rounded-full bg-black/25 blur-md -z-10 transition group-hover:opacity-40" />
                </Link>
              </motion.div>
            ))}
          </div>
          {/* لوح الرف */}
          <div className="relative h-4 rounded-full bg-gradient-to-b from-white to-[#d9d5cc] shadow-[0_10px_20px_-10px_rgba(13,36,76,.35)]" />
        </div>
        <div className="text-center mt-6 min-h-12" aria-live="polite">
          <b className="text-lg text-ink">{(() => { const h = shelf.find(x => x.k === hover); return h ? tr(h.ar, h.en) : tr("اختر قطعة من الرف", "Pick an item from the shelf"); })()}</b>
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

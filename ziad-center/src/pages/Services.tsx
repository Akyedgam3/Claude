import { useSearchParams } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { Page, Reveal } from "../components/Page";
import ProductCard from "../components/ProductCard";

export default function Services() {
  const { t, lang } = useI18n(); const { products } = useData();
  const [sp, setSp] = useSearchParams(); const q = (sp.get("q") || "").trim().toLowerCase();
  const list = q ? products.filter(p => [p.ar, p.en, p.descAr, p.descEn, p.id].join(" ").toLowerCase().includes(q)) : products;
  return (
    <Page className="max-w-6xl mx-auto px-4 pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <h1 className="display text-4xl md:text-5xl text-ink">{t("services")}</h1>
        <input className="input !w-72" placeholder={lang === "ar" ? "ابحث عن منتج…" : "Search products…"} aria-label={lang === "ar" ? "بحث" : "Search"} value={sp.get("q") || ""} onChange={e => setSp(e.target.value ? { q: e.target.value } : {})} />
      </div>
      {list.length === 0 && <div className="card p-8 text-center text-slate-600">{lang === "ar" ? "لا توجد نتائج" : "No results"}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {list.map((p, i) => <Reveal key={p.id} delay={(i % 4) * .05}><ProductCard p={p} /></Reveal>)}
      </div>
    </Page>
  );
}

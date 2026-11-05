import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { blockOf } from "../lib/theme";
import type { Product } from "../lib/types";
import Art, { hasArt } from "./Art";
import Icon from "./Icon";

export default function ProductCard({ p }: { p: Product }) {
  const { t, pick, money } = useI18n(); const { settings } = useData();
  const sale = p.sale && p.sale.ends > Date.now() ? p.sale.pct : 0;
  const bg = blockOf(p.id);
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
      <Link to={`/services/${p.id}`} className="card block overflow-hidden group h-full">
        <div className="h-48 grid place-items-center relative overflow-hidden" style={{ background: bg }}>
          <div className="halftone absolute inset-0 opacity-[.12] text-ink [mask-image:linear-gradient(135deg,transparent_35%,#000)]" aria-hidden />
          {sale > 0 && <span className="absolute top-3 end-3 z-10 bg-ink text-white text-xs font-bold px-3 py-1 rounded-full">-{sale}%</span>}
          {p.image ? <img src={p.image} alt={pick(p)} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            : hasArt(p.id) ? <Art id={p.id} className="relative w-full h-full p-2 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2" />
            : <Icon n="box" size={64} className="relative text-ink/70" />}
        </div>
        <div className="p-5">
          <h3 className="font-extrabold text-lg">{pick(p)}</h3>
          <p className="text-sm text-slate-600 mt-1 line-clamp-2 min-h-10">{pick({ ar: p.descAr, en: p.descEn })}</p>
          <div className="mt-4 flex items-center justify-between text-sm"><span><span className="text-slate-600">{t("from")} </span><b>{money(p.basePrice * Math.max(1, p.minQty), settings.usdToSyp)}</b></span>
            <span className="grid place-items-center w-9 h-9 rounded-full bg-ink text-white group-hover:bg-[var(--color-cta)] group-hover:text-white transition-colors" aria-hidden><Icon n="arrow" size={16} className="rtl:-scale-x-100" /></span></div>
        </div>
      </Link>
    </motion.div>
  );
}

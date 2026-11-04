import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import type { Product } from "../lib/types";

export default function ProductCard({ p }: { p: Product }) {
  const { t, pick, money } = useI18n(); const { settings } = useData();
  return (
    <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Link to={`/services/${p.id}`} className="card block overflow-hidden group">
        <div className="h-36 grid place-items-center text-6xl relative overflow-hidden" style={{ background: `radial-gradient(circle at 30% 20%, hsl(${30 + p.hue % 25} 85% 55% / .35), transparent 60%), radial-gradient(circle at 80% 90%, hsl(${10 + p.hue % 20} 90% 55% / .2), transparent 55%), #151517` }}>
          {p.sale && p.sale.ends > Date.now() && <span className="absolute top-3 end-3 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full">-{p.sale.pct}%</span>}
          <span className="transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6 drop-shadow-2xl">{p.icon}</span>
        </div>
        <div className="p-4">
          <h3 className="font-extrabold text-lg">{pick(p)}</h3>
          <p className="text-sm text-slate-400 mt-1 line-clamp-2 min-h-10">{pick({ ar: p.descAr, en: p.descEn })}</p>
          <div className="mt-3 text-sm"><span className="text-slate-400">{t("from")} </span><b className="text-gold">{money(p.basePrice * Math.max(1, p.minQty), settings.usdToSyp)}</b></div>
        </div>
      </Link>
    </motion.div>
  );
}

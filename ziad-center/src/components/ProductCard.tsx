import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { unitPrice } from "../lib/catalog";
import { blockOf } from "../lib/theme";
import type { Product } from "../lib/types";
import Art, { hasArt } from "./Art";
import Icon from "./Icon";
import { Heart } from "../lib/extras";

export default function ProductCard({ p }: { p: Product }) {
  const { t, pick, money } = useI18n(); const { settings } = useData();
  const sel = Object.fromEntries(p.options.map(g => [g.key, g.choices[0]?.id]));
  const qty = Math.max(1, p.minQty);
  const now = unitPrice(p, sel, qty).unit * qty;
  const sale = p.sale && p.sale.ends > Date.now() ? p.sale.pct : 0;
  const before = sale ? now / (1 - sale / 100) : 0;
  const code = p.code || `ZC-${p.id.slice(0, 6).toUpperCase()}`;
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
      <Link to={`/services/${p.id}`} className="group block h-full">
        <div className="relative aspect-square rounded-[1.4rem] overflow-hidden border border-line grid place-items-center" style={{ background: p.image ? "#f5f4f1" : blockOf(p.id) }}>
          <svg className="absolute inset-x-0 bottom-0 w-full h-1/2 text-ink/10" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden>{[0, 8, 16, 24].map(o => <path key={o} d={`M0 ${50 + o}C60 ${30 + o} 120 ${80 + o / 2} 200 ${44 + o}`} fill="none" stroke="currentColor" />)}</svg>
          {p.image ? <img src={p.image} alt={pick(p)} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            : hasArt(p.id) ? <Art id={p.id} className="relative w-full h-full p-4 transition-transform duration-500 group-hover:scale-110" />
            : <Icon n="box" size={64} className="relative text-ink/60" />}
          <span className="absolute top-3 end-3 flex items-center gap-1 text-[10px] font-extrabold text-ink/80"><svg width="14" height="14" viewBox="0 0 28 28" aria-hidden><path d="M4 5h20L6 23h20" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>ZIAD</span>
          <span className="absolute bottom-3 start-3 bg-white/90 rounded-full px-2.5 py-1 text-[10px] font-bold text-ink flex items-center gap-1" dir="ltr"><i className="w-1.5 h-1.5 rounded-full bg-[var(--color-cta)]" />{code}</span>
          <Heart id={p.id} className="absolute top-3 start-3 z-10" />
          {sale > 0 && <span className="absolute top-16 start-3 bg-[var(--color-cta)] text-white text-xs font-bold px-2.5 py-1 rounded-full">-{sale}%</span>}
        </div>
        <h3 className="mt-4 font-bold text-ink group-hover:text-[var(--color-cta)] transition-colors line-clamp-2">{pick(p)}</h3>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-slate-600">{t("from")}</span><b className="text-ink">{money(now, settings.usdToSyp)}</b>
          {sale > 0 && <><s className="text-slate-500 text-xs">{money(before, settings.usdToSyp)}</s><span className="text-xs font-bold text-[var(--color-cta)]">-{sale}%</span></>}
        </div>
      </Link>
    </motion.div>
  );
}

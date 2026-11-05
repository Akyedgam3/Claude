import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { useCart } from "../lib/cart";
import { unitPrice } from "../lib/catalog";
import { Page } from "../components/Page";
import Art, { hasArt } from "../components/Art";
import Icon from "../components/Icon";
import { blockOf } from "../lib/theme";

export default function ProductPage() {
  const { id } = useParams(); const nav = useNavigate();
  const { t, pick, money } = useI18n(); const { products, settings } = useData(); const cart = useCart();
  const p = products.find(x => x.id === id);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(p?.minQty ?? 1);
  const [notes, setNotes] = useState(""); const [size, setSize] = useState("");
  const full = useMemo(() => p ? Object.fromEntries(p.options.map(g => [g.key, sel[g.key] ?? g.choices[0].id])) : {}, [p, sel]);
  if (!p) return <div className="p-10 text-center">{t("loading")}</div>;
  const { unit, disc, sale } = unitPrice(p, full, qty);
  const total = Math.round(unit * qty * 100) / 100;
  const add = (go: boolean) => {
    cart.add({ productId: p.id, name: p.ar + " / " + p.en, options: full, qty, unitUSD: unit, totalUSD: total, notes, customSize: size });
    nav(go ? "/cart" : "/services");
  };
  return (
    <Page className="max-w-5xl mx-auto px-4 pt-10 grid md:grid-cols-2 gap-8">
      <motion.div initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card h-80 md:h-auto min-h-80 grid place-items-center overflow-hidden" style={{ background: blockOf(p.id) }}>
        <motion.div className="w-full h-full grid place-items-center" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}>{p.image ? <img src={p.image} alt={pick(p)} className="w-full h-full object-cover rounded-[inherit]" /> : hasArt(p.id) ? <Art id={p.id} className="w-full max-h-[420px]" /> : <Icon n="box" size={140} className="text-ink/70" />}</motion.div>
      </motion.div>
      <div className="space-y-5">
        <div><h1 className="text-3xl font-extrabold">{pick(p)}</h1><p className="text-slate-600 mt-1">{pick({ ar: p.descAr, en: p.descEn })}</p></div>
        {p.options.map(g => (
          <div key={g.key}><span className="label">{pick(g)}</span>
            <div className="flex flex-wrap gap-2">
              {g.choices.map(c => <button key={c.id} onClick={() => setSel({ ...sel, [g.key]: c.id })} className={`px-4 py-2 rounded-full border text-sm transition ${full[g.key] === c.id ? "border-gold bg-gold/15 text-gold font-bold" : "border-line hover:border-slate-400"}`}>{pick(c)}</button>)}
            </div>
          </div>
        ))}
        <div><label className="label">{t("qty")} {p.minQty > 1 && `(min ${p.minQty})`}</label>
          <input className="input" type="number" min={p.minQty} value={qty} onChange={e => setQty(Math.max(p.minQty, +e.target.value || p.minQty))} /></div>
        <div><label className="label">{t("customSize")}</label><input className="input" value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. 90×50 cm" /></div>
        <div><label className="label">{t("notes")}</label><textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></div>
        <div className="card p-4 space-y-1">
          <div className="flex justify-between text-sm text-slate-600"><span>{t("unit")}</span><span>{money(unit, settings.usdToSyp)}</span></div>
          {sale > 0 && <div className="flex justify-between text-sm text-rose-400"><span className="flex items-center gap-1"><Icon n="bolt" size={16} /> {t("flash")}</span><span>-{Math.round(sale * 100)}%</span></div>}
          {disc > 0 && <div className="flex justify-between text-sm text-emerald-400"><span>{t("discount")}</span><span>-{disc * 100}%</span></div>}
          <div className="flex justify-between text-xl font-extrabold"><span>{t("total")}</span><motion.span key={total} initial={{ scale: 1.2, color: "#e9b85b" }} animate={{ scale: 1, color: "#0b1633" }}>{money(total, settings.usdToSyp)}</motion.span></div>
        </div>
        <div className="flex gap-3"><button className="btn btn-primary flex-1" onClick={() => add(true)}>{t("orderNow")}</button><button className="btn btn-ghost" onClick={() => add(false)}>{t("addCart")}</button></div>
      </div>
    </Page>
  );
}

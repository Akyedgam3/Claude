import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { blockOf } from "../lib/theme";
import { Page, Reveal } from "../components/Page";
import ProductCard from "../components/ProductCard";
import Icon from "../components/Icon";
import Art, { hasArt } from "../components/Art";

function Countdown({ to }: { to: number }) {
  const { t } = useI18n(); const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const r = Math.max(0, to - now) / 1000;
  const parts: [number, "d" | "h" | "m" | "s"][] = [[Math.floor(r / 86400), "d"], [Math.floor(r / 3600) % 24, "h"], [Math.floor(r / 60) % 60, "m"], [Math.floor(r) % 60, "s"]];
  return <div className="flex gap-2" dir="ltr">{parts.map(([v, k]) => <div key={k} className="bg-white/15 rounded-2xl w-16 py-2 text-center"><div className="text-2xl font-extrabold tabular-nums">{String(v).padStart(2, "0")}</div><div className="text-[10px] opacity-80">{t(k)}</div></div>)}</div>;
}

export default function Home() {
  const { t, pick, lang } = useI18n(); const { products } = useData();
  const flash = products.filter(p => p.sale && p.sale.ends > Date.now());
  const steps = [["01", t("st1"), t("st1d"), "#67e8f9"], ["02", t("st2"), t("st2d"), "#fde047"], ["03", t("st3"), t("st3d"), "#f9a8d4"], ["04", t("st4"), t("st4d"), "#fdba74"]];
  const names = [...products, ...products];
  return (
    <Page>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-14 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6">
            <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 text-sm font-medium bg-ink text-white rounded-full px-4 py-1.5 mb-6"><span className="w-2 h-2 rounded-full bg-[var(--color-cta)]" />{t("tag")}</motion.span>
            <motion.h1 initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: [.2, .8, .2, 1] }} className="display text-[clamp(2.8rem,8vw,5.6rem)]">
              {t("heroTitle1")}<br /><span className="grad-text">{t("heroTitle2")}</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 }} className="mt-6 text-lg text-slate-700 max-w-lg">{t("heroSub")}</motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .45 }} className="mt-8 flex gap-3 flex-wrap">
              <Link to="/services" className="btn btn-primary text-lg">{t("orderNow")}<Icon n="arrow" size={18} className="rtl:-scale-x-100" /></Link>
              <Link to="/orders" className="btn btn-ghost text-lg">{t("track")}</Link>
            </motion.div>
          </div>
          <div className="lg:col-span-6 grid grid-cols-6 grid-rows-6 gap-3 h-[420px] md:h-[520px]">
            {products.slice(0, 4).map((p, i) => {
              const pos = ["col-span-4 row-span-4", "col-span-2 row-span-3", "col-span-2 row-span-3", "col-span-4 row-span-2"][i];
              return (
                <motion.div key={p.id} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .2 + i * .1, duration: .5 }} className={pos}>
                  <Link to={`/services/${p.id}`} aria-label={pick(p)} className="group relative block h-full rounded-[1.6rem] overflow-hidden border border-black/5" style={{ background: blockOf(p.id) }}>
                    <div className="halftone absolute inset-0 opacity-[.12] text-ink [mask-image:linear-gradient(135deg,transparent_40%,#000)]" aria-hidden />
                    {p.image ? <img src={p.image} alt="" className="absolute inset-0 w-full h-full object-cover" /> : hasArt(p.id) ? <Art id={p.id} className="absolute inset-0 w-full h-full p-2 group-hover:scale-110 transition-transform duration-500" /> : <Icon n="box" size={56} className="absolute inset-0 m-auto text-ink/70" />}
                    <span className="absolute bottom-3 start-3 bg-white/90 text-ink text-xs font-bold rounded-full px-3 py-1">{pick(p)}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="bg-ink text-white py-4 overflow-hidden" aria-hidden dir="ltr">
        <div className="marquee">{names.map((p, i) => <span key={i} className="flex items-center text-xl md:text-2xl font-bold px-6 whitespace-nowrap">{pick(p)}<span className="ms-12 w-2.5 h-2.5 rounded-sm rotate-45" style={{ background: ["#67e8f9", "#f9a8d4", "#fde047", "#f97316"][i % 4] }} /></span>)}</div>
      </div>

      {/* FLASH */}
      {flash.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-16">
          <div className="rounded-[2rem] p-6 md:p-8 bg-[#db2777] text-white">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6"><h2 className="display text-3xl flex items-center gap-2"><Icon n="bolt" size={28} /> {t("flash")}</h2><div className="flex items-center gap-3 text-sm">{t("endsIn")}<Countdown to={Math.min(...flash.map(p => p.sale!.ends))} /></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-ink">{flash.map(p => <ProductCard key={p.id} p={p} />)}</div>
          </div>
        </section>
      )}

      {/* SERVICES */}
      <section id="services" className="max-w-6xl mx-auto px-4 mt-20">
        <Reveal><div className="flex items-end justify-between mb-8"><h2 className="display text-4xl md:text-5xl">{t("services")}</h2><Link to="/services" className="font-bold text-gold underline underline-offset-4">{t("browse")} {lang === "ar" ? "←" : "→"}</Link></div></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.slice(0, 8).map((p, i) => <Reveal key={p.id} delay={(i % 4) * .06}><ProductCard p={p} /></Reveal>)}
        </div>
      </section>

      {/* HOW */}
      <section className="max-w-6xl mx-auto px-4 mt-24">
        <Reveal><h2 className="display text-4xl md:text-5xl mb-10">{t("how")}</h2></Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map(([n, a, b, c], i) => (
            <Reveal key={n} delay={i * .08}><div className="rounded-[1.6rem] p-6 h-full" style={{ background: c }}><div className="display text-6xl opacity-30">{n}</div><h3 className="font-extrabold text-xl mt-4">{a}</h3><p className="text-sm text-ink/80 mt-1">{b}</p></div></Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 mt-24">
        <Reveal><div className="rounded-[2rem] bg-ink text-white p-8 md:p-14 flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
          <div className="halftone absolute inset-y-0 end-0 w-1/2 opacity-20 text-[#67e8f9] [mask-image:linear-gradient(to_left,#000,transparent)]" aria-hidden />
          <h2 className="display text-3xl md:text-5xl max-w-xl relative">{t("ctaTitle")}</h2>
          <Link to="/services" className="btn btn-primary text-lg relative">{t("orderNow")}</Link>
        </div></Reveal>
      </section>
    </Page>
  );
}

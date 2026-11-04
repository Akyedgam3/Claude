import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { Page, Reveal } from "../components/Page";
import ProductCard from "../components/ProductCard";

function Countdown({ to }: { to: number }) {
  const { t } = useI18n(); const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const r = Math.max(0, to - now) / 1000;
  const parts: [number, "d" | "h" | "m" | "s"][] = [[Math.floor(r / 86400), "d"], [Math.floor(r / 3600) % 24, "h"], [Math.floor(r / 60) % 60, "m"], [Math.floor(r) % 60, "s"]];
  return <div className="flex gap-2" dir="ltr">{parts.map(([v, k]) => <div key={k} className="card w-16 py-2 text-center"><div className="text-2xl font-extrabold tabular-nums text-gold">{String(v).padStart(2, "0")}</div><div className="text-[10px] text-slate-400">{t(k)}</div></div>)}</div>;
}

export default function Home() {
  const { t, pick } = useI18n(); const { products } = useData();
  const { scrollY } = useScroll(); const y = useTransform(scrollY, [0, 700], [0, 140]);
  const flash = products.filter(p => p.sale && p.sale.ends > Date.now());
  const steps = [["01", t("st1"), t("st1d")], ["02", t("st2"), t("st2d")], ["03", t("st3"), t("st3d")], ["04", t("st4"), t("st4d")]];
  const names = [...products, ...products].map((p, i) => <span key={i} className="display text-3xl md:text-5xl px-6 whitespace-nowrap text-white/15">{p.icon} {pick(p)}</span>);
  return (
    <Page>
      <section className="relative overflow-hidden grain">
        <motion.div style={{ y }} className="absolute -top-32 start-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-gold/20 blur-[120px]" />
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 grid lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-3">
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-block text-xs tracking-widest text-gold border border-gold/40 rounded-full px-4 py-1 mb-6">{t("tag")}</motion.span>
            <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: [.2, .8, .2, 1] }} className="display text-6xl md:text-8xl leading-[1.05] font-bold">
              {t("heroTitle1")}<br /><span className="grad-text">{t("heroTitle2")}</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .35 }} className="mt-6 text-lg text-slate-300 max-w-xl">{t("heroSub")}</motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .5 }} className="mt-8 flex gap-3 flex-wrap">
              <Link to="/services" className="btn btn-primary text-lg">{t("orderNow")}</Link>
              <Link to="/orders" className="btn btn-ghost text-lg">{t("track")}</Link>
            </motion.div>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-3">
            {products.slice(0, 4).map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .3 + i * .1 }} className={i % 3 === 0 ? "translate-y-6" : ""}>
                <Link to={`/services/${p.id}`} className="card aspect-square grid place-items-center text-6xl hover:border-gold transition group">
                  <span className="group-hover:scale-125 transition-transform duration-500">{p.icon}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-y border-line py-5 overflow-hidden" aria-hidden><div className="marquee" dir="ltr">{names}</div></div>

      {flash.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-16">
          <div className="card p-6 bg-gradient-to-br from-gold/10 to-transparent border-gold/40">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-5"><h2 className="display text-3xl">⚡ {t("flash")}</h2><div className="flex items-center gap-3 text-sm text-slate-300">{t("endsIn")}<Countdown to={Math.min(...flash.map(p => p.sale!.ends))} /></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{flash.map(p => <ProductCard key={p.id} p={p} />)}</div>
          </div>
        </section>
      )}

      <section id="services" className="max-w-6xl mx-auto px-4 mt-20">
        <Reveal><div className="flex items-end justify-between mb-8"><h2 className="display text-4xl md:text-5xl">{t("services")}</h2><Link to="/services" className="text-gold text-sm">{t("browse")} ←</Link></div></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.slice(0, 8).map((p, i) => <Reveal key={p.id} delay={(i % 4) * .06}><ProductCard p={p} /></Reveal>)}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-24">
        <Reveal><h2 className="display text-4xl md:text-5xl mb-10">{t("how")}</h2></Reveal>
        <div className="grid md:grid-cols-4 gap-5">
          {steps.map(([n, a, b], i) => <Reveal key={n} delay={i * .08}><div className="border-t border-gold/50 pt-5"><div className="display text-5xl text-gold/60">{n}</div><h3 className="font-bold text-lg mt-3">{a}</h3><p className="text-sm text-slate-400 mt-1">{b}</p></div></Reveal>)}
        </div>
      </section>
    </Page>
  );
}

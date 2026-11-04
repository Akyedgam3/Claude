import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { useEffect, useState } from "react";
import { Page, Reveal } from "../components/Page";
import ProductCard from "../components/ProductCard";

function Countdown({ to }: { to: number }) {
  const { t } = useI18n(); const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const r = Math.max(0, to - now) / 1000;
  const parts: [number, "d" | "h" | "m" | "s"][] = [[Math.floor(r / 86400), "d"], [Math.floor(r / 3600) % 24, "h"], [Math.floor(r / 60) % 60, "m"], [Math.floor(r) % 60, "s"]];
  return <div className="flex gap-2" dir="ltr">{parts.map(([v, k]) => <div key={k} className="card w-16 py-2 text-center"><div className="text-2xl font-extrabold tabular-nums">{String(v).padStart(2, "0")}</div><div className="text-[10px] text-slate-400">{t(k)}</div></div>)}</div>;
}

export default function Home() {
  const { t } = useI18n(); const { products } = useData();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 600], [0, 120]); const y2 = useTransform(scrollY, [0, 600], [0, -80]);
  const flash = products.filter(p => p.sale && p.sale.ends > Date.now());
  const feats = [["⚡", t("fast"), t("fastD")], ["🎯", t("quality"), t("qualityD")], ["📍", t("track2"), t("track2D")], ["💳", t("pay"), t("payD")]];
  return (
    <Page>
      <section className="relative overflow-hidden">
        <motion.div style={{ y: y1 }} className="absolute -top-20 start-[-10%] w-[420px] h-[420px] rounded-full bg-cyan/30 blur-[110px]" />
        <motion.div style={{ y: y2 }} className="absolute top-10 end-[-8%] w-[380px] h-[380px] rounded-full bg-magenta/30 blur-[110px]" />
        <div className="absolute bottom-0 start-1/3 w-[300px] h-[300px] rounded-full bg-yellow/15 blur-[110px]" />
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }} className="text-5xl md:text-7xl font-extrabold leading-tight">
            {t("heroTitle1")} <span className="grad-text">{t("heroTitle2")}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3, duration: .7 }} className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">{t("heroSub")}</motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .5 }} className="mt-9 flex gap-3 justify-center flex-wrap">
            <Link to="/services" className="btn btn-primary text-lg">{t("orderNow")}</Link>
            <a href="#services" className="btn btn-ghost text-lg">{t("browse")}</a>
          </motion.div>
          <div className="mt-14 flex justify-center gap-3 text-4xl">
            {["🖨️", "📦", "🎨", "🏷️", "☕"].map((e, i) => (
              <motion.span key={e} animate={{ y: [0, -14, 0] }} transition={{ repeat: Infinity, duration: 3, delay: i * .35, ease: "easeInOut" }} className="card w-16 h-16 grid place-items-center">{e}</motion.span>
            ))}
          </div>
        </div>
      </section>

      {flash.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mb-14">
          <div className="card p-6 bg-gradient-to-br from-rose-900/40 to-panel">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-5"><h2 className="text-2xl font-extrabold">⚡ {t("flash")}</h2><div className="flex items-center gap-3 text-sm text-slate-300">{t("endsIn")}<Countdown to={Math.min(...flash.map(p => p.sale!.ends))} /></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{flash.map(p => <ProductCard key={p.id} p={p} />)}</div>
          </div>
        </section>
      )}

      <section id="services" className="max-w-6xl mx-auto px-4 pt-6">
        <Reveal><h2 className="text-3xl font-extrabold mb-6">{t("services")}</h2></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.slice(0, 8).map((p, i) => <Reveal key={p.id} delay={i * .05}><ProductCard p={p} /></Reveal>)}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pt-20">
        <Reveal><h2 className="text-3xl font-extrabold mb-6 text-center">{t("why")}</h2></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {feats.map(([i, a, b], n) => (
            <Reveal key={a} delay={n * .08}><div className="card p-6 text-center h-full"><div className="text-4xl mb-3">{i}</div><h3 className="font-bold text-lg">{a}</h3><p className="text-sm text-slate-400 mt-1">{b}</p></div></Reveal>
          ))}
        </div>
      </section>
    </Page>
  );
}

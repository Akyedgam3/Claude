import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { blockOf } from "../lib/theme";
import { Page, Reveal } from "../components/Page";
import ProductCard from "../components/ProductCard";
import BoxSequence from "../components/BoxSequence";
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
  const steps = [["01", t("st1"), t("st1d"), "#dce3f0"], ["02", t("st2"), t("st2d"), "#edeae5"], ["03", t("st3"), t("st3d"), "#d4f0f1"], ["04", t("st4"), t("st4d"), "#e6ecf7"]];
  const names = [...products, ...products];
  return (
    <Page>
      <BoxSequence />

      {/* FLASH */}
      {flash.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-16">
          <div className="rounded-[2rem] p-6 md:p-8 bg-ink text-white">
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
          <div className="halftone absolute inset-y-0 end-0 w-1/2 opacity-20 text-[var(--color-teal)] [mask-image:linear-gradient(to_left,#000,transparent)]" aria-hidden />
          <h2 className="display text-3xl md:text-5xl max-w-xl relative">{t("ctaTitle")}</h2>
          <Link to="/services" className="btn btn-primary text-lg relative">{t("orderNow")}</Link>
        </div></Reveal>
      </section>
    </Page>
  );
}

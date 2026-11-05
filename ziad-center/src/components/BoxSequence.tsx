// قسم تمرير ثلاثي الأبعاد (CSS 3D) — مجسّم أصلي لزياد سنتر: علبة تنفتح، القطع تطلع، تُطبع بالهوية، ثم تُغلّف للتسليم.
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, easeInOut, type MotionValue } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";

const NAVY = "#0d244c", BLUE = "#3263db", TEAL = "#50c4c8", PAPER = "#f7f5f1", WHITE = "#fbfaf7";

const Z = ({ c = BLUE, s = 22 }: { c?: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 28 28" aria-hidden><path d="M4 5h20L6 23h20" fill="none" stroke={c} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// وجه مستوٍ في الفضاء الثلاثي: مركزه عند الأصل ثم يُحوَّل
function Face({ w, h, t, bg, children, style }: { w: number; h: number; t: string; bg: string; children?: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, transform: t, background: bg, ...style }}>{children}</div>;
}
const P3: CSSProperties = { position: "absolute", left: 0, top: 0, width: 0, height: 0, transformStyle: "preserve-3d" };

/** علبة (قاعدة مفتوحة من الأعلى أو غطاء مفتوح من الأسفل) */
function Box({ W, D, H, top, bottom, shades, topContent }: { W: number; D: number; H: number; top: boolean; bottom: boolean; shades: [string, string, string, string, string]; topContent?: ReactNode }) {
  const [tp, fr, bk, rt, lf] = shades;
  return (
    <div style={P3}>
      {top && <Face w={W} h={D} t={`translateZ(${H / 2}px)`} bg={tp} style={{ display: "grid", placeItems: "center" }}>{topContent}</Face>}
      {bottom && <Face w={W} h={D} t={`translateZ(${-H / 2}px)`} bg={bk} />}
      <Face w={W} h={H} t={`translateY(${D / 2}px) rotateX(90deg)`} bg={fr} />
      <Face w={W} h={H} t={`translateY(${-D / 2}px) rotateX(90deg)`} bg={bk} />
      <Face w={H} h={D} t={`translateX(${W / 2}px) rotateY(90deg)`} bg={rt} />
      <Face w={H} h={D} t={`translateX(${-W / 2}px) rotateY(90deg)`} bg={lf} />
    </div>
  );
}

/** قطعة مطبوعة: وجه أبيض + طبقة الهوية تظهر مع التقدّم */
function Item({ w, h, x, y, z, rz, print, blank, brand }: { w: number; h: number; x: MotionValue<number>; y: MotionValue<number>; z: MotionValue<number>; rz: MotionValue<number>; print: MotionValue<number>; blank: string; brand: ReactNode }) {
  return (
    <motion.div style={{ ...P3, x, y, z, rotateZ: rz }}>
      <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, background: blank, borderRadius: 3, boxShadow: "0 1px 0 rgba(13,36,76,.08), 0 18px 30px -18px rgba(13,36,76,.45)", overflow: "hidden" }}>
        <motion.div style={{ position: "absolute", inset: 0, opacity: print }}>{brand}</motion.div>
      </div>
    </motion.div>
  );
}

const lines = (n: number, w: string, c = "#c9d0dd", gap = 9) => Array.from({ length: n }).map((_, i) => <div key={i} style={{ height: 3, width: i === n - 1 ? "55%" : w, background: c, borderRadius: 2, marginTop: i ? gap - 3 : 0 }} />);
const waves = (c: string) => <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden>{[0, 6, 12, 18].map(o => <path key={o} d={`M0 ${40 + o / 2}C30 ${28 + o} 60 ${55 + o / 3} 100 ${36 + o}`} fill="none" stroke={c} strokeWidth=".5" opacity=".55" />)}</svg>;

const COPY = {
  ar: [
    null,
    { k: "02 / التصميم", t: "نصمّم بهويتك قبل أي طباعة.", d: "أرسل فكرتك أو ملفك، ونجهّز لك نموذجاً للموافقة قبل التنفيذ." },
    { k: "03 / الطباعة", t: "لكل قطعة ورقها وتشطيبها.", d: "اختر الخامة والمقاس والكمية، ويظهر لك السعر فوراً قبل التأكيد." },
    { k: "04 / التسليم", t: "تغليف أنيق وتتبّع حتى الباب.", d: "ادفع عبر شام كاش وتابع طلبك مرحلة بمرحلة من لوحة طلباتك." },
  ],
  en: [
    null,
    { k: "02 / Design", t: "We design with your identity first.", d: "Send your idea or file and approve a proof before we print." },
    { k: "03 / Print", t: "The right paper and finish for every piece.", d: "Choose material, size and quantity — see the price instantly." },
    { k: "04 / Delivery", t: "Elegant packing, tracked to your door.", d: "Pay with Sham Cash and follow every stage of your order." },
  ],
};

export default function BoxSequence() {
  const { t, pick, lang } = useI18n(); const { products } = useData();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [ch, setCh] = useState(0);
  useMotionValueEvent(p, "change", v => setCh(Math.min(3, Math.max(0, Math.floor(v * 4.0001)))));
  const r = (inp: number[], out: number[]) => useTransform(p, inp, out, { ease: easeInOut });
  const K = [0, .22, .45, .76, .95]; // مفاتيح الحركة: مغلق → مفتوح → مطبوع → عائد

  // العالم
  const wRX = r([0, 1], [60, 54]); const wRZ = r([0, .25, .55, 1], [-38, -46, -32, -40]); const wS = r([0, .8, 1], [1, 1, .94]);
  // الغطاء
  const lidZ = r(K, [97, 97, 150, 150, 97]); const lidX = r(K, [0, 0, -300, -300, 0]); const lidY = r(K, [0, 0, 230, 230, 0]); const lidR = r(K, [0, 0, -12, -12, 0]);
  // القطع (ترتفع من داخل العلبة وتنتشر)
  const mk = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, r1: number) => ({ x: r(K, [x0, x0, x1, x1, x0]), y: r(K, [y0, y0, y1, y1, y0]), z: r(K, [z0, z0, z1, z1 - 30, z0]), rz: r(K, [0, 0, r1, r1, 0]) });
  const letter = mk(-6, 0, 14, -40, -20, 190, -8), env = mk(20, 30, 18, 110, 80, 150, 10), card = mk(-40, 40, 22, 150, -70, 230, 16), card2 = mk(-36, 36, 20, 175, -40, 215, 22), note = mk(40, -40, 26, -170, -90, 120, -14);
  const print = r([.48, .64], [0, 1]);
  const bg = useTransform(p, [0, .74, .9], [PAPER, PAPER, NAVY]);
  const shadowO = r([0, .3, .76, 1], [.55, .3, .3, .55]);
  const dark = ch === 3;
  const c = COPY[lang][ch];
  const bars = [0, 1, 2, 3].map(i => useTransform(p, [i / 4, (i + 1) / 4], ["0%", "100%"])); // eslint-disable-line react-hooks/rules-of-hooks

  return (
    <motion.section ref={ref} style={{ backgroundColor: bg }} className="relative h-[420vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* علامة مائية */}
        <div aria-hidden className="absolute bottom-[8vh] inset-x-0 text-center font-black leading-none select-none text-[22vw]" dir="ltr"
          style={{ color: "transparent", WebkitTextStroke: `1.5px ${dark ? "rgba(255,255,255,.12)" : "rgba(13,36,76,.10)"}`, transition: "all .7s" }}>ZIAD</div>

        <div className="relative h-full max-w-6xl mx-auto px-4 grid md:grid-cols-2 items-center pt-20 md:pt-0">
          {/* النص */}
          <div className={`relative z-10 order-2 md:order-1 transition-colors duration-700 ${dark ? "text-white" : "text-ink"}`}>
            <AnimatePresence mode="wait">
              <motion.div key={ch} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: .4 }}>
                {ch === 0 ? (
                  <>
                    <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-cta)]"><span className="w-7 h-0.5 bg-current" />{t("tag")}</div>
                    <h1 className="display text-[clamp(2.2rem,5.4vw,4rem)] mt-4">{t("heroTitle1")} <span className="text-[var(--color-cta)]">{t("heroTitle2")}</span></h1>
                    <p className="mt-5 text-slate-700 max-w-md">{t("heroSub")}</p>
                    <div className="mt-7 flex gap-3 flex-wrap"><Link to="/services" className="btn btn-primary">{t("orderNow")}</Link><Link to="/orders" className="btn btn-ghost">{t("track")}</Link></div>
                    <div className="mt-6 flex flex-wrap gap-2 max-w-md">{products.slice(0, 8).map(x => <Link key={x.id} to={`/services/${x.id}`} className="text-xs border border-line bg-white/70 rounded-full px-3 py-1.5 hover:border-ink">{pick(x)}</Link>)}</div>
                  </>
                ) : c && (
                  <>
                    <div className={`flex items-center gap-3 text-sm font-medium ${dark ? "text-[var(--color-teal)]" : "text-[var(--color-cta)]"}`}><span className="w-7 h-0.5 bg-current" />{c.k}</div>
                    <h2 className="display text-[clamp(2rem,4.6vw,3.4rem)] mt-4 max-w-md">{c.t}</h2>
                    <p className={`mt-4 max-w-md ${dark ? "text-white/75" : "text-slate-700"}`}>{c.d}</p>
                    {dark && (
                      <>
                        <div className="mt-6 flex gap-8">
                          {[["6", lang === "ar" ? "مراحل تتبّع" : "tracking stages"], [String(products.length), lang === "ar" ? "خدمات" : "services"], ["AR · EN", lang === "ar" ? "لغتان" : "languages"]].map(([n, l]) => <div key={l}><div className="text-2xl font-extrabold">{n}</div><div className="text-xs text-white/70 mt-1">{l}</div></div>)}
                        </div>
                        <div className="mt-7 flex gap-3 flex-wrap"><Link to="/services" className="btn !bg-[var(--color-teal)] !text-ink">{t("orderNow")}</Link><Link to="/services" className="btn border border-white/40 text-white">{t("browse")}</Link></div>
                      </>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* المشهد ثلاثي الأبعاد */}
          <div className="relative order-1 md:order-2 h-[44vh] md:h-[80vh]" style={{ perspective: 1600 }} aria-hidden>
            <div className="absolute left-1/2 top-1/2 scale-[.58] sm:scale-75 lg:scale-100" style={{ transformStyle: "preserve-3d" }}>
              <motion.div style={{ ...P3, rotateX: wRX, rotateZ: wRZ, scale: wS }}>
                {/* ظل الأرض */}
                <motion.div style={{ position: "absolute", left: -260, top: -190, width: 520, height: 380, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(13,36,76,.45), transparent)", transform: "translateZ(-2px)", opacity: shadowO }} />
                {/* القاعدة */}
                <div style={{ ...P3, transform: "translateZ(40px)" }}>
                  <Box W={300} D={210} H={80} top={false} bottom shades={[NAVY, "#173a7c", NAVY, "#0a1d3f", "#12306a"]} />
                  <Face w={288} h={198} t="translateZ(-34px)" bg="#e8ecf4" />
                </div>
                {/* القطع */}
                <Item w={96} h={120} {...note} print={print} blank="#ecebe7" brand={<div style={{ position: "absolute", inset: 0, background: NAVY, display: "grid", placeItems: "center" }}>{waves(TEAL)}<div style={{ position: "absolute", top: 5, insetInline: 8, display: "flex", justifyContent: "space-between" }}>{Array.from({ length: 9 }).map((_, i) => <span key={i} style={{ width: 4, height: 7, borderRadius: 2, background: "#cfd5e2" }} />)}</div><Z c={TEAL} s={30} /></div>} />
                <Item w={220} h={154} {...letter} print={print} blank={WHITE} brand={<div style={{ position: "absolute", inset: 0, padding: 14 }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Z s={18} /><b style={{ fontSize: 8, letterSpacing: 2, color: NAVY }}>ZIAD CENTER</b></div><div style={{ marginTop: 16 }}>{lines(6, "92%")}</div><div style={{ position: "absolute", insetInline: 0, bottom: 0, height: 6, background: `linear-gradient(90deg, ${BLUE}, ${TEAL})` }} /></div>} />
                <Item w={170} h={82} {...env} print={print} blank={WHITE} brand={<div style={{ position: "absolute", inset: 0, padding: 10 }}><Z s={14} /><div style={{ position: "absolute", left: 14, bottom: 16, width: 70, height: 22, borderRadius: 3, background: "#e3e8f2", padding: 6 }}>{lines(2, "80%", "#b9c3d6", 6)}</div><div style={{ position: "absolute", insetInline: 0, bottom: 0, height: 5, background: BLUE }} /></div>} />
                <Item w={92} h={56} {...card2} print={print} blank={WHITE} brand={<div style={{ position: "absolute", inset: 0, padding: 8 }}>{lines(3, "70%", "#b9c3d6", 6)}<div style={{ position: "absolute", insetInline: 0, bottom: 0, height: 4, background: TEAL }} /></div>} />
                <Item w={92} h={56} {...card} print={print} blank={WHITE} brand={<div style={{ position: "absolute", inset: 0, background: NAVY, display: "grid", placeItems: "center" }}>{waves(TEAL)}<Z c="#fff" s={20} /></div>} />
                {/* الغطاء */}
                <motion.div style={{ ...P3, x: lidX, y: lidY, z: lidZ, rotateZ: lidR }}>
                  <Box W={312} D={222} H={34} top bottom={false} shades={["#13306a", "#1b3d80", NAVY, "#0a1d3f", "#123068"]} topContent={<div style={{ position: "relative", width: "100%", height: "100%", display: "grid", placeItems: "center", background: `linear-gradient(135deg, #1d3d7a, ${NAVY})` }}>{waves(TEAL)}<div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff" }}><Z c="#fff" s={34} /><span style={{ fontWeight: 800, fontSize: 22, letterSpacing: 1 }}>زياد سنتر</span></div></div>} />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* شريط التقدّم */}
        <div className="absolute bottom-4 inset-x-0 max-w-6xl mx-auto px-4 grid grid-cols-4 gap-2" aria-hidden>
          {bars.map((w, i) => <div key={i} className={`h-[3px] rounded-full overflow-hidden ${dark ? "bg-white/15" : "bg-ink/10"}`}><motion.div className={`h-full ${dark ? "bg-[var(--color-teal)]" : "bg-[var(--color-cta)]"}`} style={{ width: w }} /></div>)}
        </div>
      </div>
    </motion.section>
  );
}

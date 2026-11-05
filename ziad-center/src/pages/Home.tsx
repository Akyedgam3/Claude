import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { blockOf } from "../lib/theme";
import { Page, Reveal } from "../components/Page";
import ProductCard from "../components/ProductCard";
import BoxSequence from "../components/BoxSequence";
import Icon from "../components/Icon";
import Art, { hasArt } from "../components/Art";
import { waLink } from "../components/Layout";
import { TIPS } from "./Info";

function Countdown({ to }: { to: number }) {
  const { t } = useI18n(); const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const r = Math.max(0, to - now) / 1000;
  const parts: [number, "d" | "h" | "m" | "s"][] = [[Math.floor(r / 86400), "d"], [Math.floor(r / 3600) % 24, "h"], [Math.floor(r / 60) % 60, "m"], [Math.floor(r) % 60, "s"]];
  return <div className="flex gap-2" dir="ltr">{parts.map(([v, k]) => <div key={k} className="bg-white/10 rounded-2xl w-16 py-2 text-center"><div className="text-2xl font-extrabold tabular-nums">{String(v).padStart(2, "0")}</div><div className="text-[10px] opacity-80">{t(k)}</div></div>)}</div>;
}

const Head = ({ title, sub, more }: { title: string; sub?: string; more?: { to: string; label: string } }) => (
  <Reveal><div className="flex items-end justify-between gap-4 mb-8">
    <div><h2 className="display text-3xl md:text-[2.6rem] text-ink">{title}</h2>{sub && <p className="mt-3 text-slate-700">{sub}</p>}</div>
    {more && <Link to={more.to} className="shrink-0 text-sm font-bold text-[var(--color-cta)]">{more.label}</Link>}
  </div></Reveal>
);

export default function Home() {
  const { t, pick, lang } = useI18n(); const { products, settings } = useData();
  const tr = (a: string, e: string) => (lang === "ar" ? a : e);
  const arrow = lang === "ar" ? "←" : "→";
  const flash = products.filter(p => p.sale && p.sale.ends > Date.now());
  const [tab, setTab] = useState<"all" | "sale" | "new">("all");
  const tabbed = tab === "sale" ? flash : tab === "new" ? [...products].reverse().slice(0, 4) : products.slice(0, 8);

  const why: [string, string][] = [
    [tr("تصميم داخلي", "In-house design"), tr("فريقنا يجهّز التصميم ويرسل لك نموذجاً للموافقة قبل الطباعة.", "Our team prepares the design and sends a proof before printing.")],
    [tr("أسعار واضحة فوراً", "Instant clear pricing"), tr("اختر الخيارات والكمية ويظهر السعر مباشرة بالليرة أو الدولار.", "Pick options and quantity and see the price in SYP or USD.")],
    [tr("دفع سهل عبر شام كاش", "Easy Sham Cash payment"), tr("امسح الرمز وارفع الإيصال، ويتم التأكيد بسرعة.", "Scan the code, upload the receipt, get confirmed fast.")],
    [tr("تتبّع حتى التسليم", "Tracked to delivery"), tr("تعرف مرحلة طلبك في كل لحظة من حسابك.", "Know your order's stage at any moment from your account.")],
  ];
  const steps: [string, string][] = [
    [tr("اختر المنتج", "Choose"), tr("حدد المنتج والمقاس والكمية.", "Pick product, size and quantity.")],
    [tr("ادفع", "Pay"), tr("عبر شام كاش مع رفع الإيصال.", "Via Sham Cash with a receipt.")],
    [tr("التصميم", "Design"), tr("نموذج للموافقة قبل التنفيذ.", "A proof to approve first.")],
    [tr("الطباعة والتغليف", "Print & pack"), tr("تنفيذ دقيق وتغليف أنيق.", "Precise print, neat packing.")],
    [tr("التسليم", "Delivery"), tr("نوصل طلبك ونبلغك بكل مرحلة.", "Delivered with updates at every stage.")],
  ];

  return (
    <Page>
      <BoxSequence />

      {/* التصنيفات */}
      <section className="max-w-6xl mx-auto px-4 mt-24">
        <Head title={tr("مطبوعات وهدايا لكل ما تحتاجه علامتك", "Print and gifts for everything your brand needs")} sub={tr("اختر التصنيف، خصّص طلبك، وشاهد السعر قبل التأكيد.", "Pick a category, customise, and see the price before you confirm.")} more={{ to: "/services", label: `${tr("كل المنتجات", "All products")} ${arrow}` }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {products.slice(0, 8).map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * .05}>
              <Link to={`/services/${p.id}`} className="group block rounded-[1.5rem] bg-[var(--color-cream)] p-5 h-full hover:-translate-y-1 transition">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden grid place-items-center" style={{ background: blockOf(p.id) }}>
                  {p.image ? <img src={p.image} alt={pick(p)} loading="lazy" className="w-full h-full object-cover" /> : hasArt(p.id) ? <Art id={p.id} className="w-full h-full p-2 group-hover:scale-105 transition-transform duration-500" /> : <Icon n="box" size={48} className="text-ink/60" />}
                </div>
                <h3 className="mt-4 font-extrabold text-ink">{pick(p)}</h3>
                <div className="mt-1 flex items-end justify-between gap-2"><p className="text-xs text-slate-600 line-clamp-2">{pick({ ar: p.descAr, en: p.descEn })}</p>
                  <span className="shrink-0 w-9 h-9 rounded-full bg-white grid place-items-center text-[var(--color-cta)] group-hover:bg-[var(--color-cta)] group-hover:text-white transition"><Icon n="arrow" size={16} className="rtl:-scale-x-100" /></span></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* تبويبات المنتجات */}
      <section className="max-w-6xl mx-auto px-4 mt-24">
        <Head title={tr("منتجات جاهزة للطباعة بشعارك", "Ready-to-print products with your logo")} />
        <div className="flex gap-2 mb-6" role="tablist">
          {([["all", tr("الكل", "All")], ["sale", tr("العروض", "Offers")], ["new", tr("الأحدث", "Newest")]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-5 h-11 rounded-full text-sm font-bold border transition ${tab === k ? "bg-ink text-white border-ink" : "border-line text-ink hover:border-ink"}`}>{l}</button>
          ))}
        </div>
        {tabbed.length ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{tabbed.map(p => <ProductCard key={p.id} p={p} />)}</div>
          : <div className="card p-8 text-center text-slate-600">{tr("لا توجد عروض حالياً", "No offers right now")}</div>}
      </section>

      {/* العروض */}
      {flash.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-24">
          <div className="rounded-[2rem] p-6 md:p-10 bg-gradient-to-br from-[#163a7a] to-ink text-white">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6"><h2 className="display text-3xl flex items-center gap-2"><Icon n="bolt" size={28} /> {t("flash")}</h2><div className="flex items-center gap-3 text-sm">{t("endsIn")}<Countdown to={Math.min(...flash.map(p => p.sale!.ends))} /></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-ink">{flash.slice(0, 4).map(p => <ProductCard key={p.id} p={p} />)}</div>
            <div className="text-center mt-6"><Link to="/offers" className="btn border border-white/40 text-white">{tr("كل منتجات العروض", "All offers")}</Link></div>
          </div>
        </section>
      )}

      {/* لماذا نحن */}
      <section className="max-w-6xl mx-auto px-4 mt-28 grid lg:grid-cols-5 gap-10 items-start">
        <Reveal className="lg:col-span-2"><h2 className="display text-3xl md:text-[2.6rem] text-ink">{tr("أكثر من مطبعة… شريك لعلامتك", "More than a printer — a partner for your brand")}</h2><p className="mt-4 text-slate-700">{tr("من أول فكرة حتى يصل الطلب إلى بابك.", "From the first idea until the order reaches you.")}</p></Reveal>
        <div className="lg:col-span-3 grid sm:grid-cols-2 gap-x-8">
          {why.map(([a, b], i) => <Reveal key={a} delay={i * .06}><div className="border-t border-line py-6"><h3 className="font-extrabold text-ink">{a}</h3><p className="mt-2 text-sm text-slate-700 leading-7">{b}</p></div></Reveal>)}
        </div>
      </section>

      {/* المراحل */}
      <section className="mt-28 bg-[var(--color-cream)] py-20">
        <div className="max-w-6xl mx-auto px-4">
          <Head title={tr("من الفكرة إلى التسليم", "From idea to delivery")} sub={tr("خمس خطوات واضحة، وتعرف أين طلبك دائماً.", "Five clear steps — you always know where your order is.")} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {steps.map(([a, b], i) => <Reveal key={a} delay={i * .06}><div className="bg-white rounded-[1.4rem] p-6 h-full"><div className="text-sm font-bold text-[var(--color-cta)]">0{i + 1}</div><h3 className="mt-6 font-extrabold text-ink">{a}</h3><p className="mt-2 text-sm text-slate-700">{b}</p></div></Reveal>)}
          </div>
        </div>
      </section>

      {/* نصائح */}
      <section className="max-w-6xl mx-auto px-4 mt-24">
        <Head title={tr("نصائح من زياد سنتر", "Tips from Ziad Center")} more={{ to: "/tips", label: `${tr("اقرأ المزيد", "Read more")} ${arrow}` }} />
        <div className="grid md:grid-cols-3 gap-5">
          {TIPS.map((x, i) => <Reveal key={i} delay={i * .06}><Link to="/tips" className="block bg-[var(--color-paper)] border border-line rounded-[1.4rem] p-6 h-full hover:border-ink transition"><h3 className="font-extrabold text-ink">{lang === "ar" ? x.tAr : x.tEn}</h3><p className="mt-3 text-sm text-slate-700 leading-7 line-clamp-3">{lang === "ar" ? x.bAr : x.bEn}</p></Link></Reveal>)}
        </div>
      </section>

      {/* دعوة */}
      <section className="max-w-6xl mx-auto px-4 mt-24">
        <Reveal><div className="relative overflow-hidden rounded-[2rem] bg-[var(--color-cta)] text-white p-8 md:p-14 flex flex-wrap items-center justify-between gap-6">
          <div><h2 className="display text-3xl md:text-5xl">{tr("لنبدأ طلبك القادم", "Let's start your next order")}</h2><p className="mt-3 text-white/85">{tr("أرسل لنا فكرتك ونرد عليك بعرض سعر واضح.", "Send us your idea and get a clear quote.")}</p></div>
          <div className="flex gap-3 flex-wrap">
            <a href={settings.whatsapp ? waLink(settings.whatsapp, tr("مرحباً، أريد عرض سعر", "Hello, I'd like a quote")) : "#/contact"} target="_blank" rel="noreferrer" className="btn bg-white text-ink hover:bg-white/90">{tr("اطلب عرض سعر", "Get a quote")}</a>
            <Link to="/services" className="btn border border-white/50 text-white">{tr("تصفّح المنتجات", "Browse products")}</Link>
          </div>
        </div></Reveal>
      </section>
    </Page>
  );
}

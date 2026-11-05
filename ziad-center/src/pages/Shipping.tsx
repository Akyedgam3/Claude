import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { Page, Reveal } from "../components/Page";
import { waLink } from "../components/Layout";

const NAVY = "#0d244c", BLUE = "#3263db", TEAL = "#50c4c8";

const Waves = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 1440 500" preserveAspectRatio="none" aria-hidden>
    {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M0 ${120 + i * 38}C360 ${40 + i * 40} 720 ${260 + i * 30} 1440 ${90 + i * 42}`} fill="none" stroke={BLUE} strokeOpacity=".16" strokeWidth="1.500" />)}
  </svg>
);

/** رسم حاوية: خلايا ملوّنة + عجلات */
function Container({ cells }: { cells: string[] }) {
  return (
    <svg viewBox="0 0 600 220" className="w-full" role="img" aria-hidden>
      <rect x="10" y="10" width="580" height="180" rx="10" fill="#f5f4f1" stroke={NAVY} strokeWidth="4" />
      {Array.from({ length: 26 }).map((_, i) => <line key={i} x1={30 + i * 21} x2={30 + i * 21} y1="20" y2="180" stroke={NAVY} strokeOpacity=".06" />)}
      {cells.map((c, i) => c && <rect key={i} x={24 + (i % 9) * 62} y={22 + Math.floor(i / 9) * 40} width="56" height="34" rx="4" fill={c} />)}
      {[90, 130, 470, 510].map(x => <circle key={x} cx={x} cy="205" r="13" fill={NAVY} />)}
    </svg>
  );
}
const OTHER = ["#cfc6b6", "#a9cdd0", "#d9c79c", "#b9c3d6"];
const lcl = Array.from({ length: 36 }, (_, i) => { const r = Math.floor(i / 9), c = i % 9; if (r >= 1 && c < 3) return BLUE; if (r === 0 && c > 6) return ""; if (r === 1 && c > 7) return ""; return OTHER[(i * 7) % 4]; });
const fcl = Array.from({ length: 36 }, () => NAVY);

const Eyebrow = ({ children }: { children: ReactNode }) => <div className="text-sm font-medium text-[var(--color-cta)]">{children}</div>;
const H2 = ({ children }: { children: ReactNode }) => <h2 className="display text-3xl md:text-[2.6rem] text-ink mt-3">{children}</h2>;

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-[1.4rem] border border-line bg-white">
      <table className="w-full text-start min-w-[640px]">
        <thead><tr className="bg-ink text-white">{head.map(h => <th key={h} className="text-start font-bold px-5 py-4">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className={i % 2 ? "bg-[var(--color-paper)]" : ""}>{r.map((c, j) => <td key={j} className={`px-5 py-4 border-t border-line ${j === 0 ? "font-bold text-ink" : "text-slate-700"}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Truck() {
  return (
    <svg viewBox="0 0 520 340" className="w-full" aria-hidden>
      {[0, 1, 2].map(i => <path key={i} d={`M0 ${120 + i * 70}C120 ${60 + i * 70} 200 ${200 + i * 50} 520 ${110 + i * 75}`} fill="none" stroke={BLUE} strokeOpacity=".35" strokeWidth="3" />)}
      <ellipse cx="280" cy="292" rx="200" ry="14" fill="#000" opacity=".12" />
      <rect x="90" y="90" width="260" height="170" rx="8" fill={NAVY} />
      {[0, 1, 2, 3].map(i => <path key={i} d={`M90 ${150 + i * 26}C170 ${120 + i * 26} 250 ${190 + i * 26} 350 ${140 + i * 26}`} fill="none" stroke={TEAL} strokeOpacity=".35" strokeWidth="2" />)}
      <path d="M190 140h40l-34 44h40" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <text x="220" y="225" fill="#fff" fontSize="22" fontWeight="800" textAnchor="middle" fontFamily="Rubik, sans-serif">ZIAD CENTER</text>
      <path d="M352 140h70l40 52v68h-112z" fill="#2f63c9" />
      <path d="M368 152h48l28 38h-76z" fill="#cfe0f5" />
      <rect x="350" y="248" width="120" height="14" rx="4" fill="#24365c" />
      {[150, 300, 420].map(x => <g key={x}><circle cx={x} cy="268" r="26" fill="#1c2233" /><circle cx={x} cy="268" r="11" fill="#c9ced8" /></g>)}
    </svg>
  );
}

export default function Shipping() {
  const { lang } = useI18n(); const { settings } = useData();
  const tr = (a: string, e: string) => (lang === "ar" ? a : e);
  const quote = settings.whatsapp ? waLink(settings.whatsapp, tr("مرحباً، أريد عرض سعر يشمل الشحن", "Hello, I'd like a quote including shipping")) : "#/contact";

  // حاسبة الحجم
  const [f, setF] = useState({ n: 40, w: 12, l: 60, wd: 40, h: 40 });
  const cbm = (f.l * f.wd * f.h) / 1e6 * f.n;
  const actual = f.w * f.n;
  const vol = (f.l * f.wd * f.h) / 6000 * f.n;
  const rec = cbm < 1 ? [tr("شحن سريع أو جوي", "Express or air"), tr("للعيّنات والكميات الصغيرة.", "For samples and small quantities.")]
    : cbm <= 15 ? [tr("شحن جزئي (LCL)", "Groupage (LCL)"), tr("تدفع على حجم شحنتك فقط.", "You pay only for your volume.")]
    : cbm <= 28 ? [tr("حاوية 20 قدماً", "20 ft container"), tr("غالباً أوفر من الجزئي عند هذا الحجم.", "Usually cheaper than LCL at this volume.")]
    : [tr("حاوية 40 قدماً", "40 ft container"), tr("للكميات الكبيرة جداً.", "For very large quantities.")];
  const fields: [keyof typeof f, string][] = [["n", tr("عدد الكراتين", "Cartons")], ["w", tr("وزن الكرتونة (كغ)", "Carton weight (kg)")], ["l", tr("الطول (سم)", "Length (cm)")], ["wd", tr("العرض (سم)", "Width (cm)")], ["h", tr("الارتفاع (سم)", "Height (cm)")]];
  const fmt = (x: number, d = 2) => x.toLocaleString("en-US", { maximumFractionDigits: d });

  const modes = [
    { code: "LCL", t: tr("الشحن الجزئي", "Groupage"), d: tr("تُحمَّل طلبيتك مع بضائع أخرى في نفس الحاوية أو الشاحنة، وتدفع حسب الحجم أو الوزن. خيار مناسب للكميات الصغيرة والمتوسطة، لكنه يحتاج وقتاً إضافياً للتجميع.", "Your order shares a container or truck with other goods and you pay by volume or weight. Good for small and medium quantities, but consolidation adds time."),
      pro: [tr("تكلفة حسب حجمك فقط", "Pay only for your volume"), tr("لا حاجة لانتظار امتلاء الحاوية", "No need to fill a container"), tr("مناسب للطلبات الصغيرة", "Fits small orders")], con: [tr("مدة أطول للتجميع والتوزيع", "Longer consolidation time"), tr("مناولة أكثر للبضاعة", "More handling")], cells: lcl, legend: true },
    { code: "FCL", t: tr("الشحن الكامل", "Full container"), d: tr("تُخصَّص الحاوية أو الشاحنة لطلبيتك وحدك وتُغلق من التحميل حتى الوصول. الأنسب للكميات الكبيرة، مع حماية أفضل للبضاعة.", "The container or truck is reserved for your order alone and stays sealed until arrival. Best for large quantities, with better protection."),
      pro: [tr("سعر ثابت للحاوية", "Fixed container price"), tr("إجراءات أسرع", "Faster processing"), tr("حماية أعلى للبضاعة", "Better protection")], con: [tr("أغلى للكميات الصغيرة", "Costlier for small loads")], cells: fcl, legend: false },
  ];

  return (
    <Page>
      {/* الهيرو */}
      <section className="relative overflow-hidden bg-[var(--color-cream)]">
        <Waves className="absolute inset-0 w-full h-full" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32">
          <Eyebrow>{tr("دليل الشحن", "Shipping guide")}</Eyebrow>
          <h1 className="display text-[clamp(2.2rem,5vw,3.6rem)] text-ink mt-4 max-w-3xl">{tr("كيف تصلك طلبيتك؟ جزئي أم كامل", "How does your order arrive? Groupage or full")}</h1>
          <p className="mt-5 text-slate-700 max-w-2xl">{tr("دليل مختصر يشرح طرق الشحن والفرق بينها، لتختار الأنسب لكمية طلبك وموعدك.", "A short guide to shipping options and their differences, so you can pick what suits your quantity and timeline.")}</p>
          <div className="mt-8 flex gap-3 flex-wrap"><a href={quote} target="_blank" rel="noreferrer" className="btn bg-ink text-white hover:bg-[#163a7a]">{tr("اطلب عرض سعر", "Get a quote")}</a><Link to="/services" className="btn btn-ghost">{tr("تصفّح المنتجات", "Browse products")}</Link></div>
          <div className="mt-6 flex gap-2 flex-wrap">{[["/tips", tr("نصائح الطباعة", "Print tips")], ["/about", tr("من نحن", "About")], ["/contact", tr("تواصل معنا", "Contact")]].map(([to, l]) => <Link key={to} to={to} className="bg-white rounded-full px-4 h-10 grid place-items-center text-sm text-ink border border-line hover:border-ink">{l}</Link>)}</div>
        </div>
      </section>

      {/* الأساسيات */}
      <section className="max-w-6xl mx-auto px-4 mt-24">
        <Reveal><Eyebrow>{tr("الأساسيات", "The basics")}</Eyebrow><H2>{tr("ما الفرق بين الشحن الجزئي والكامل؟", "Groupage vs full container")}</H2><p className="mt-3 text-slate-700">{tr("الفرق ببساطة: هل تتشارك المساحة مع شحنات أخرى، أم تحجزها كاملة لطلبيتك.", "Simply: do you share the space with other shipments, or reserve it all for your order.")}</p></Reveal>
        <div className="grid lg:grid-cols-2 gap-6 mt-10">
          {modes.map(m => (
            <Reveal key={m.code}><div className="rounded-[1.6rem] border border-line bg-white p-6 md:p-8 h-full">
              <div className="flex justify-between items-center text-sm mb-3"><b className="text-ink">{m.legend ? tr("طلبيتك مع شحنات أخرى", "Your order with others") : tr("طلبيتك وحدها في الحاوية", "Your order alone")}</b>
                {m.legend && <span className="flex gap-4 text-slate-600"><span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm" style={{ background: BLUE }} />{tr("طلبيتك", "Yours")}</span><span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-[#cfc6b6]" />{tr("شحنات أخرى", "Others")}</span></span>}</div>
              <Container cells={m.cells} />
              <h3 className="mt-6 text-2xl font-extrabold text-ink">{m.t} <span className="text-sm text-[var(--color-cta)]" dir="ltr">{m.code}</span></h3>
              <p className="mt-3 text-slate-700 leading-8">{m.d}</p>
              <div className="grid grid-cols-2 gap-4 mt-5 text-sm">
                <div><b className="text-emerald-700">{tr("المزايا", "Pros")}</b><ul className="mt-2 space-y-2">{m.pro.map(x => <li key={x} className="flex gap-2"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />{x}</li>)}</ul></div>
                <div><b className="text-rose-700">{tr("انتبه", "Watch out")}</b><ul className="mt-2 space-y-2">{m.con.map(x => <li key={x} className="flex gap-2"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />{x}</li>)}</ul></div>
              </div>
            </div></Reveal>
          ))}
        </div>
      </section>

      {/* الاختيار */}
      <section className="max-w-6xl mx-auto px-4 mt-24 space-y-6">
        <Reveal><Eyebrow>{tr("الاختيار", "Choosing")}</Eyebrow><H2>{tr("متى تختار كل طريقة؟", "When to choose which?")}</H2><p className="mt-3 text-slate-700">{tr("ابدأ بحجم الشحنة بالمتر المكعب، ثم قارنه بالجدول.", "Start with your shipment volume in cubic metres, then compare.")}</p></Reveal>
        <Table head={[tr("حجم الشحنة", "Volume"), tr("الخيار الأنسب غالباً", "Usually best"), tr("ملاحظة", "Note")]} rows={[
          [tr("أقل من 1 م³ أو طلب مستعجل", "Under 1 m³ or urgent"), tr("شحن سريع أو جوي", "Express or air"), tr("للعيّنات والطرود الخفيفة", "Samples and light parcels")],
          [tr("من 1 إلى 15 م³ تقريباً", "About 1–15 m³"), tr("شحن جزئي بري أو بحري", "Groupage by road or sea"), tr("تدفع على حجمك فقط", "Pay only for your volume")],
          [tr("من 15 إلى 28 م³ تقريباً", "About 15–28 m³"), tr("حاوية 20 قدماً", "20 ft container"), tr("غالباً أوفر من الجزئي", "Often cheaper than groupage")],
          [tr("أكثر من 28 م³", "Over 28 m³"), tr("حاوية 40 قدماً أو أكثر", "40 ft container or more"), tr("للكميات الكبيرة", "For large quantities")],
        ]} />
        <Table head={[tr("نوع الحاوية", "Container"), tr("الحجم الداخلي", "Internal volume"), tr("الحجم العملي للتحميل", "Practical load")]} rows={[
          [tr("حاوية 20 قدماً", "20 ft"), "≈ 33 m³", "25 – 28 m³"], [tr("حاوية 40 قدماً", "40 ft"), "≈ 67 m³", "55 – 58 m³"], [tr("حاوية 40 قدماً عالية (HC)", "40 ft High Cube"), "≈ 76 m³", "65 – 68 m³"],
        ]} />
        <p className="text-sm text-slate-600">{tr("الأرقام تقريبية وتختلف حسب نوع الكراتين وطريقة التحميل، ونؤكدها في عرض السعر.", "Figures are approximate and vary with cartons and loading; we confirm them in your quote.")}</p>
      </section>

      {/* الحاسبة */}
      <section className="mt-24 bg-[var(--color-paper)] py-20">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal><Eyebrow>{tr("حاسبة الحجم", "Volume calculator")}</Eyebrow><H2>{tr("احسب حجم شحنتك", "Calculate your shipment")}</H2><p className="mt-3 text-slate-700">{tr("أدخل عدد الكراتين وقياساتها ووزنها لتعرف الحجم والخيار الأقرب.", "Enter carton count, size and weight to see the volume and the closest option.")}</p></Reveal>
          <div className="mt-10 rounded-[1.6rem] border border-line bg-white p-5 md:p-8 grid lg:grid-cols-2 gap-8">
            <div>
              <div className="grid grid-cols-2 gap-4">
                {fields.map(([k, l]) => <label key={k} className="block"><span className="label">{l}</span><input className="input" type="number" min={0} inputMode="decimal" value={f[k]} onChange={e => setF({ ...f, [k]: Math.max(0, +e.target.value || 0) })} /></label>)}
              </div>
              <p className="mt-5 text-xs text-slate-600 leading-6">{tr("الحجم = الطول × العرض × الارتفاع (بالمتر) × عدد الكراتين. الوزن الحجمي للشحن الجوي = (الطول × العرض × الارتفاع بالسنتيمتر ÷ 6000) لكل كرتونة.", "Volume = L × W × H (m) × cartons. Air volumetric weight = (L × W × H in cm ÷ 6000) per carton.")}</p>
            </div>
            <div className="rounded-[1.4rem] bg-ink text-white p-6" aria-live="polite">
              {[[tr("الحجم الكلي", "Total volume"), `${fmt(cbm)} m³`], [tr("الوزن الفعلي", "Actual weight"), `${fmt(actual, 1)} kg`], [tr("الوزن الحجمي (جوي)", "Volumetric (air)"), `${fmt(vol, 1)} kg`]].map(([l, v]) => <div key={l} className="flex justify-between items-center py-4 border-b border-white/10"><span className="text-white/75">{l}</span><b className="text-2xl" dir="ltr">{v}</b></div>)}
              <div className="mt-5 rounded-2xl bg-white/10 p-4"><b>{tr("الأنسب غالباً: ", "Usually best: ")}{rec[0]}</b><p className="text-sm text-white/75 mt-1">{rec[1]} {tr("الحساب تقريبي، والسعر النهائي في عرض السعر.", "Estimate only; the final price is in your quote.")}</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* التسليم والمستندات */}
      <section className="max-w-6xl mx-auto px-4 mt-24 grid lg:grid-cols-2 gap-10 items-center">
        <Reveal className="order-2 lg:order-1"><div className="rounded-[1.8rem] bg-[var(--color-cream)] p-8"><Truck /></div></Reveal>
        <Reveal className="order-1 lg:order-2">
          <Eyebrow>{tr("عند الوصول", "On arrival")}</Eyebrow><H2>{tr("التسليم والمستندات والجمارك", "Delivery, documents and customs")}</H2>
          <p className="mt-4 text-slate-700 leading-8">{tr("نوضّح في عرض السعر أين يتم التسليم بالضبط، لتعرف من البداية ما يشمله السعر.", "Your quote states exactly where delivery happens, so you know what the price covers.")}</p>
          <ul className="mt-5 space-y-3">{[tr("نجهّز الفاتورة وقائمة التعبئة مع الشحنة.", "We prepare the invoice and packing list."), tr("نرسل لك تفاصيل الشحنة وموعد الوصول المتوقع.", "We send shipment details and the expected arrival."), tr("يمكن ترقيم الكراتين وكتابة محتواها لتسهيل الاستلام.", "Cartons can be numbered and labelled for easy receipt.")].map(x => <li key={x} className="flex gap-3"><span className="w-6 h-6 rounded-full bg-[var(--color-teal)] text-white grid place-items-center shrink-0"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" strokeWidth="3" /></svg></span>{x}</li>)}</ul>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
            {[["EXW", tr("تستلم من مستودعنا وتتولى الشحن.", "Collect from our warehouse.")], ["FOB", tr("نسلّم على متن السفينة في ميناء الشحن.", "Delivered on board at origin port.")], ["CIF", tr("نشحن ونؤمّن حتى ميناء الوصول.", "Shipped and insured to destination port.")], ["DDP", tr("نسلّم حتى بابك شاملاً الرسوم.", "Delivered to your door, duties paid.")]].map(([k, d]) => <div key={k} className="rounded-2xl border border-line bg-white p-4"><b className="text-[var(--color-cta)]" dir="ltr">{k}</b><p className="mt-2 text-sm text-slate-700 leading-6">{d}</p></div>)}
          </div>
          <p className="mt-4 text-xs text-slate-600">{tr("هذه اختصارات شروط التسليم الدولية (Incoterms) الصادرة عن غرفة التجارة الدولية.", "These are International Commercial Terms (Incoterms) published by the ICC.")}</p>
        </Reveal>
      </section>

      {/* اسألنا عن الشحن — بيانات التواصل من لوحة الإدارة */}
      <section className="max-w-6xl mx-auto px-4 mt-24">
        <Reveal><div className="rounded-[2rem] bg-gradient-to-br from-[#3a6ee6] to-[#2449a8] text-white p-8 md:p-14 grid lg:grid-cols-2 gap-8 items-center">
          <div><h2 className="display text-3xl md:text-[2.6rem]">{tr("اسألنا عن شحن طلبك", "Ask us about shipping")}</h2><p className="mt-4 text-white/85">{tr("أرسل المنتج والكمية ومكان التسليم، ونقترح عليك أنسب طريقة مع السعر والمدة.", "Send the product, quantity and destination — we'll suggest the best option with price and timing.")}</p></div>
          <div className="space-y-3">
            {([
              settings.whatsapp && ["WhatsApp", settings.whatsapp, waLink(settings.whatsapp, tr("مرحباً، لدي سؤال عن الشحن", "Hi, I have a shipping question")), tr("واتساب", "WhatsApp")],
              settings.phone && [tr("الهاتف", "Phone"), settings.phone, `tel:${settings.phone}`, tr("اتصل", "Call")],
              settings.email && [tr("البريد الإلكتروني", "Email"), settings.email, `mailto:${settings.email}`, tr("راسلنا", "Email us")],
            ].filter(Boolean) as [string, string, string, string][]).map(([l, v, h, b]) => (
              <div key={l} className="flex items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/10 p-4"><div><div className="text-sm text-white/75">{l}</div><b className="text-lg" dir="ltr">{v}</b></div><a href={h} target="_blank" rel="noreferrer" className="btn bg-white text-[#2449a8] !min-h-10 !py-0 text-sm">{b}</a></div>
            ))}
            {!settings.whatsapp && !settings.phone && !settings.email && <Link to="/contact" className="btn bg-white text-[#2449a8]">{tr("تواصل معنا", "Contact us")}</Link>}
          </div>
        </div></Reveal>
      </section>

      {/* معلومات زياد من لوحة الإدارة */}
      {(lang === "ar" ? settings.shippingAr : settings.shippingEn) && (
        <section className="max-w-6xl mx-auto px-4 mt-20"><div className="card p-6 md:p-8"><h2 className="text-2xl font-extrabold text-ink">{tr("مناطق التوصيل لدينا", "Our delivery areas")}</h2><p className="mt-3 leading-8 whitespace-pre-line text-slate-800">{lang === "ar" ? settings.shippingAr : settings.shippingEn}</p></div></section>
      )}
    </Page>
  );
}

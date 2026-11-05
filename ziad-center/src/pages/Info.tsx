import type { ReactNode } from "react";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { Page, Reveal } from "../components/Page";
import ProductCard from "../components/ProductCard";
import { waLink } from "../components/Layout";

// مقالات أصلية قصيرة — تُعدَّل لاحقاً
export const TIPS = [
  { tAr: "كيف تختار نوع الورق المناسب؟", tEn: "How to choose the right paper?",
    bAr: "الورق الخفيف (80–120 غ) مناسب للمراسلات والفلايرات الكبيرة الكمية، والمتوسط (170–250 غ) للبروشورات، أما الكروت فالأفضل 300–350 غ مع سيلوفان أو UV لتعيش أطول.",
    bEn: "Light paper (80–120gsm) suits letters and high-volume flyers, medium (170–250gsm) suits brochures, and cards work best at 300–350gsm with lamination or spot UV." },
  { tAr: "جهّز ملفك للطباعة بدون مفاجآت", tEn: "Prepare your file for print",
    bAr: "استخدم دقة 300 نقطة بالإنش، ونظام ألوان CMYK، واترك هامش قص 3 ملم من كل طرف، وحوّل الخطوط إلى منحنيات أو أرسلها مع الملف.",
    bEn: "Use 300 dpi, CMYK colour, leave a 3 mm bleed on every edge, and outline fonts or send them with the file." },
  { tAr: "متى تختار الطباعة الرقمية ومتى الأوفست؟", tEn: "Digital or offset?",
    bAr: "الطباعة الرقمية أسرع وأوفر للكميات الصغيرة والطلبات المستعجلة، والأوفست يعطي أفضل سعر للقطعة وثبات ألوان عالٍ في الكميات الكبيرة.",
    bEn: "Digital is faster and cheaper for small or urgent runs; offset gives the best unit price and colour consistency for large runs." },
];

function Shell({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <Page className="max-w-6xl mx-auto px-4 pt-14">
      <h1 className="display text-4xl md:text-5xl text-ink">{title}</h1>
      {sub && <p className="mt-4 text-slate-700 max-w-2xl">{sub}</p>}
      <div className="mt-10">{children}</div>
    </Page>
  );
}
const Text = ({ s }: { s: string }) => <div className="card p-6 md:p-8 leading-8 text-slate-800 whitespace-pre-line max-w-3xl">{s}</div>;

export function Offers() {
  const { lang } = useI18n(); const { products } = useData();
  const tr = (a: string, e: string) => (lang === "ar" ? a : e);
  const list = products.filter(p => p.sale && p.sale.ends > Date.now());
  return (
    <Shell title={tr("العروض", "Offers")} sub={tr("خصومات لفترة محدودة على منتجات مختارة.", "Limited-time discounts on selected products.")}>
      {list.length ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{list.map(p => <ProductCard key={p.id} p={p} />)}</div>
        : <div className="card p-8 text-center text-slate-600">{tr("لا توجد عروض حالياً، تابعنا قريباً.", "No offers right now — check back soon.")}</div>}
    </Shell>
  );
}

export function Tips() {
  const { lang } = useI18n(); const tr = (a: string, e: string) => (lang === "ar" ? a : e);
  return (
    <Shell title={tr("نصائح الطباعة", "Print tips")} sub={tr("إرشادات مختصرة لتحصل على أفضل نتيجة.", "Short guides for the best result.")}>
      <div className="space-y-5 max-w-3xl">
        {TIPS.map((x, i) => <Reveal key={i}><article className="card p-6 md:p-8"><h2 className="font-extrabold text-xl text-ink">{lang === "ar" ? x.tAr : x.tEn}</h2><p className="mt-3 leading-8 text-slate-800">{lang === "ar" ? x.bAr : x.bEn}</p></article></Reveal>)}
      </div>
    </Shell>
  );
}

export function Shipping() {
  const { lang } = useI18n(); const { settings } = useData(); const tr = (a: string, e: string) => (lang === "ar" ? a : e);
  const s = lang === "ar" ? settings.shippingAr : settings.shippingEn;
  return (
    <Shell title={tr("الشحن والتوصيل", "Shipping & delivery")} sub={tr("كيف يصلك طلبك.", "How your order reaches you.")}>
      <Text s={s || tr("سيتم إضافة معلومات الشحن ومناطق التوصيل قريباً.", "Shipping details and delivery areas will be added soon.")} />
    </Shell>
  );
}

export function About() {
  const { lang } = useI18n(); const { settings } = useData(); const tr = (a: string, e: string) => (lang === "ar" ? a : e);
  const s = lang === "ar" ? settings.aboutAr : settings.aboutEn;
  return (
    <Shell title={tr("من نحن", "About us")}>
      <Text s={s || tr("زياد سنتر مطبعة متكاملة للمطبوعات التجارية والتغليف والهدايا المطبوعة.", "Ziad Center is a full-service print house for commercial print, packaging and printed gifts.")} />
    </Shell>
  );
}

export function Contact() {
  const { lang, t } = useI18n(); const { settings } = useData(); const tr = (a: string, e: string) => (lang === "ar" ? a : e);
  const cards: [string, string, string][] = [
    ...(settings.whatsapp ? [["WhatsApp", settings.whatsapp, waLink(settings.whatsapp, tr("مرحباً زياد سنتر", "Hello Ziad Center"))] as [string, string, string]] : []),
    ...(settings.phone ? [[tr("الهاتف", "Phone"), settings.phone, `tel:${settings.phone}`] as [string, string, string]] : []),
    ...(settings.email ? [[t("email"), settings.email, `mailto:${settings.email}`] as [string, string, string]] : []),
  ];
  return (
    <Shell title={tr("تواصل معنا", "Contact us")} sub={tr("نرد على طلبات عروض الأسعار والاستفسارات بأسرع وقت.", "We reply to quotes and questions as fast as we can.")}>
      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map(([l, v, h]) => <a key={l} href={h} target="_blank" rel="noreferrer" className="card p-6 hover:border-ink transition"><div className="text-sm text-slate-600">{l}</div><div className="mt-2 font-extrabold text-ink" dir="ltr">{v}</div></a>)}
        {!cards.length && <div className="card p-6 text-slate-600 sm:col-span-3">{tr("سيتم إضافة وسائل التواصل قريباً.", "Contact details coming soon.")}</div>}
      </div>
      {settings.address && <div className="card p-6 mt-4"><div className="text-sm text-slate-600">{t("address")}</div><div className="mt-2 font-bold text-ink">{settings.address}</div></div>}
    </Shell>
  );
}

export function Markets() {
  const { lang } = useI18n(); const { settings } = useData(); const tr = (a: string, e: string) => (lang === "ar" ? a : e);
  const rows = (settings.markets || "").split("\n").map(l => l.split("|").map(x => x.trim())).filter(r => r[0]);
  return (
    <Shell title={tr("الأسواق", "Markets")} sub={tr("المناطق التي نخدمها ونوصل إليها، ومن تتواصل معه في كل منطقة.", "Areas we serve and deliver to, and who to contact in each.")}>
      {rows.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map(([city, phone, person], i) => (
            <Reveal key={i} delay={(i % 3) * .05}><div className="rounded-[1.4rem] border border-line bg-white p-6 h-full">
              <div className="w-10 h-10 rounded-full bg-[var(--color-cta)]/10 text-[var(--color-cta)] grid place-items-center"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path d="M12 21s-7-6.500-7-12a7 7 0 0 1 14 0c0 5.500-7 12-7 12z" fill="none" stroke="currentColor" strokeWidth="1.800" /><circle cx="12" cy="9" r="2.500" fill="currentColor" /></svg></div>
              <h2 className="mt-4 text-xl font-extrabold text-ink">{city}</h2>
              {person && <div className="text-sm text-slate-600 mt-1">{person}</div>}
              {phone && <a href={waLink(phone, tr("مرحباً زياد سنتر", "Hello Ziad Center"))} target="_blank" rel="noreferrer" className="mt-4 inline-flex font-bold text-ink hover:text-[var(--color-cta)]" dir="ltr">{phone}</a>}
            </div></Reveal>
          ))}
        </div>
      ) : <div className="card p-8 text-slate-600">{tr("سيتم إضافة الأسواق ومناطق التوصيل قريباً.", "Markets and delivery areas coming soon.")}</div>}
    </Shell>
  );
}

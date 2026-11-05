import type { Product } from "./types";
const paper = (extra = 0) => ({ key: "paper", ar: "نوع الورق", en: "Paper", choices: [
  { id: "matte", ar: "مات", en: "Matte", add: 0 },
  { id: "gloss", ar: "لامع", en: "Glossy", add: 0.002 + extra },
  { id: "premium", ar: "كوشيه فاخر 350غ", en: "Premium 350gsm", add: 0.01 + extra },
]});
// منتجات افتراضية — تُعدَّل من لوحة الإدارة (Firestore: products)
export const SEED_PRODUCTS: Product[] = [
  { id: "cards", ar: "بطاقات أعمال", en: "Business Cards", descAr: "بطاقات احترافية بتشطيبات فاخرة", descEn: "Premium business cards with luxe finishes", icon: "", hue: 190, basePrice: 0.03, minQty: 100, active: true, options: [
    paper(), { key: "finish", ar: "التشطيب", en: "Finish", choices: [
      { id: "none", ar: "بدون", en: "None", add: 0 }, { id: "lam", ar: "سيلوفان", en: "Lamination", add: 0.005 }, { id: "uv", ar: "UV بارز", en: "Spot UV", add: 0.02 }] }] },
  { id: "flyers", ar: "فلايرات وبروشورات", en: "Flyers & Brochures", descAr: "A4 / A5 / A6 بجودة عالية", descEn: "A4 / A5 / A6 high quality", icon: "", hue: 280, basePrice: 0.04, minQty: 100, active: true, options: [
    { key: "size", ar: "المقاس", en: "Size", choices: [
      { id: "a6", ar: "A6", en: "A6", add: 0 }, { id: "a5", ar: "A5", en: "A5", add: 0.02 }, { id: "a4", ar: "A4", en: "A4", add: 0.05 }] },
    paper(), { key: "sides", ar: "الوجوه", en: "Sides", choices: [
      { id: "1", ar: "وجه واحد", en: "Single", add: 0 }, { id: "2", ar: "وجهين", en: "Double", add: 0.02 }] }] },
  { id: "banners", ar: "فليكس وبانرات", en: "Banners & Flex", descAr: "طباعة كبيرة للمحلات والفعاليات (سعر المتر)", descEn: "Large-format for shops & events (per m²)", icon: "", hue: 30, basePrice: 4, minQty: 1, active: true, options: [
    { key: "material", ar: "الخامة", en: "Material", choices: [
      { id: "flex", ar: "فليكس", en: "Flex", add: 0 }, { id: "vinyl", ar: "فينيل", en: "Vinyl", add: 2 }, { id: "mesh", ar: "ميش", en: "Mesh", add: 1.5 }] }] },
  { id: "stickers", ar: "ستيكرات وملصقات", en: "Stickers & Labels", descAr: "قص دقيق بأي شكل", descEn: "Precision die-cut in any shape", icon: "", hue: 140, basePrice: 0.05, minQty: 50, active: true, options: [
    { key: "shape", ar: "الشكل", en: "Shape", choices: [
      { id: "circle", ar: "دائري", en: "Circle", add: 0 }, { id: "square", ar: "مربع", en: "Square", add: 0 }, { id: "custom", ar: "قص حسب التصميم", en: "Custom cut", add: 0.03 }] }] },
  { id: "boxes", ar: "علب وتغليف", en: "Boxes & Packaging", descAr: "علب كرتون وهدايا بطباعة مخصصة", descEn: "Custom printed gift & product boxes", icon: "", hue: 45, basePrice: 0.35, minQty: 50, active: true, options: [
    { key: "size", ar: "الحجم", en: "Size", choices: [
      { id: "s", ar: "صغير", en: "Small", add: 0 }, { id: "m", ar: "وسط", en: "Medium", add: 0.25 }, { id: "l", ar: "كبير", en: "Large", add: 0.6 }] }] },
  { id: "mugs", ar: "هدايا مطبوعة", en: "Printed Gifts", descAr: "أكواب، تيشرتات، مفاتيح وأكثر", descEn: "Mugs, t-shirts, keychains & more", icon: "", hue: 330, basePrice: 2.5, minQty: 1, active: true, options: [
    { key: "item", ar: "المنتج", en: "Item", choices: [
      { id: "mug", ar: "كوب", en: "Mug", add: 0 }, { id: "tee", ar: "تيشرت", en: "T-shirt", add: 3 }, { id: "key", ar: "ميدالية", en: "Keychain", add: -1 }] }] },
  { id: "rollup", ar: "رول أب ولوحات", en: "Roll-ups & Signs", descAr: "حلول دعاية للمعارض والمحلات", descEn: "Exhibition & storefront signage", icon: "", hue: 210, basePrice: 18, minQty: 1, active: true, options: [
    { key: "type", ar: "النوع", en: "Type", choices: [
      { id: "rollup", ar: "رول أب 80×200", en: "Roll-up 80×200", add: 0 }, { id: "xstand", ar: "ستاند X", en: "X-stand", add: -6 }, { id: "sign", ar: "لوحة محل", en: "Shop sign", add: 40 }] }] },
  { id: "design", ar: "تصميم لوغو وهوية", en: "Logo & Branding", descAr: "فريقنا يصمم لك هويتك كاملة", descEn: "Our team designs your complete identity", icon: "", hue: 260, basePrice: 25, minQty: 1, active: true, options: [
    { key: "pack", ar: "الباقة", en: "Package", choices: [
      { id: "logo", ar: "لوغو فقط", en: "Logo only", add: 0 }, { id: "brand", ar: "هوية كاملة", en: "Full branding", add: 60 }] }] },
  // أنواع إضافية — السعر 0 = «السعر حسب الطلب» حتى تُضبط الأسعار من لوحة الإدارة
  { id: "pens-metal", ar: "أقلام معدنية", en: "Metal pens", descAr: "أقلام معدنية أنيقة بشعارك بالحفر أو الطباعة", descEn: "Elegant metal pens with your engraved or printed logo", icon: "", art: "pencils", hue: 0, basePrice: 0, minQty: 100, active: true, options: [{ key: "print", ar: "طريقة الطباعة", en: "Print method", choices: [{ id: "uv", ar: "طباعة UV", en: "UV print", add: 0 }, { id: "laser", ar: "حفر ليزر", en: "Laser engraving", add: 0 }] }] },
  { id: "pens-plastic", ar: "أقلام بلاستيكية", en: "Plastic pens", descAr: "أقلام عملية بألوان متعددة للحملات والمعارض", descEn: "Practical multi-colour pens for campaigns and events", icon: "", art: "pencils", hue: 0, basePrice: 0, minQty: 250, active: true, options: [] },
  { id: "powerbank", ar: "باوربانك بشعارك", en: "Branded power banks", descAr: "شواحن متنقلة بسعات مختلفة مع شعار مؤسستك", descEn: "Portable chargers in several capacities with your logo", icon: "", art: "bottle", hue: 0, basePrice: 0, minQty: 25, active: true, options: [{ key: "print", ar: "طريقة الطباعة", en: "Print method", choices: [{ id: "uv", ar: "طباعة UV", en: "UV print", add: 0 }, { id: "laser", ar: "حفر ليزر", en: "Laser engraving", add: 0 }] }] },
  { id: "usb", ar: "فلاشات USB", en: "USB flash drives", descAr: "ذواكر بسعات متعددة ومطبوعة بهويتك", descEn: "Flash drives in several capacities printed with your identity", icon: "", art: "bottle", hue: 0, basePrice: 0, minQty: 50, active: true, options: [{ key: "print", ar: "طريقة الطباعة", en: "Print method", choices: [{ id: "uv", ar: "طباعة UV", en: "UV print", add: 0 }, { id: "laser", ar: "حفر ليزر", en: "Laser engraving", add: 0 }] }] },
  { id: "thermos", ar: "ترامس حرارية", en: "Thermal flasks", descAr: "ترامس تحافظ على الحرارة مع طباعة أو حفر", descEn: "Insulated flasks with print or engraving", icon: "", art: "bottle", hue: 0, basePrice: 0, minQty: 25, active: true, options: [{ key: "print", ar: "طريقة الطباعة", en: "Print method", choices: [{ id: "uv", ar: "طباعة UV", en: "UV print", add: 0 }, { id: "laser", ar: "حفر ليزر", en: "Laser engraving", add: 0 }] }] },
  { id: "water-bottle", ar: "مطرات مياه", en: "Water bottles", descAr: "مطرات رياضية ومكتبية بألوان متعددة", descEn: "Sports and office bottles in many colours", icon: "", art: "bottle", hue: 0, basePrice: 0, minQty: 50, active: true, options: [] },
  { id: "notebook", ar: "دفاتر ملاحظات", en: "Notebooks", descAr: "دفاتر بغلاف جلدي أو كرتوني مع شعارك", descEn: "Leather or card cover notebooks with your logo", icon: "", art: "notebook", hue: 0, basePrice: 0, minQty: 50, active: true, options: [{ key: "print", ar: "طريقة الطباعة", en: "Print method", choices: [{ id: "uv", ar: "طباعة UV", en: "UV print", add: 0 }, { id: "laser", ar: "حفر ليزر", en: "Laser engraving", add: 0 }] }] },
  { id: "agenda", ar: "أجندات مؤرخة", en: "Dated agendas", descAr: "أجندات سنوية مؤرخة بتصميم خاص لمؤسستك", descEn: "Dated yearly agendas designed for your company", icon: "", art: "notebook", hue: 0, basePrice: 0, minQty: 50, active: true, options: [{ key: "print", ar: "طريقة الطباعة", en: "Print method", choices: [{ id: "uv", ar: "طباعة UV", en: "UV print", add: 0 }, { id: "laser", ar: "حفر ليزر", en: "Laser engraving", add: 0 }] }] },
  { id: "wall-clock", ar: "ساعات حائط", en: "Wall clocks", descAr: "ساعات حائط بوجه مطبوع بشعارك", descEn: "Wall clocks with a printed logo dial", icon: "", art: "box", hue: 0, basePrice: 0, minQty: 20, active: true, options: [] },
  { id: "desk-flag", ar: "أعلام مكتبية", en: "Desk flags", descAr: "أعلام مكتبية مع سارية وقاعدة", descEn: "Desk flags with pole and base", icon: "", art: "flag", hue: 0, basePrice: 0, minQty: 10, active: true, options: [] },
  { id: "polo", ar: "قمصان بولو", en: "Polo shirts", descAr: "قمصان بولو بتطريز أو طباعة لفرق العمل", descEn: "Polo shirts with embroidery or print for teams", icon: "", art: "cap", hue: 0, basePrice: 0, minQty: 20, active: true, options: [] },
  { id: "caps", ar: "قبعات مطبوعة", en: "Printed caps", descAr: "قبعات بتطريز أو طباعة الشعار", descEn: "Caps with embroidered or printed logo", icon: "", art: "cap", hue: 0, basePrice: 0, minQty: 25, active: true, options: [] },
  { id: "gift-set", ar: "أطقم هدايا", en: "Gift sets", descAr: "أطقم هدايا بعلبة فاخرة (قلم، دفتر، مطرة…)", descEn: "Gift sets in a premium box (pen, notebook, bottle…)", icon: "", art: "box", hue: 0, basePrice: 0, minQty: 10, active: true, options: [{ key: "print", ar: "طريقة الطباعة", en: "Print method", choices: [{ id: "uv", ar: "طباعة UV", en: "UV print", add: 0 }, { id: "laser", ar: "حفر ليزر", en: "Laser engraving", add: 0 }] }] },
  { id: "trophy", ar: "دروع وتكريم", en: "Trophies & awards", descAr: "دروع كريستال وخشب مع حفر الأسماء", descEn: "Crystal and wood awards with engraved names", icon: "", art: "trophy", hue: 0, basePrice: 0, minQty: 5, active: true, options: [{ key: "print", ar: "طريقة الطباعة", en: "Print method", choices: [{ id: "uv", ar: "طباعة UV", en: "UV print", add: 0 }, { id: "laser", ar: "حفر ليزر", en: "Laser engraving", add: 0 }] }] },
  { id: "folder", ar: "ملفات شركة", en: "Company folders", descAr: "ملفات تقديم مطبوعة بجيب داخلي", descEn: "Printed presentation folders with inner pocket", icon: "", art: "folder", hue: 0, basePrice: 0, minQty: 100, active: true, options: [] },
  { id: "paper-bags", ar: "أكياس ورقية", en: "Paper bags", descAr: "أكياس ورقية وكرتونية مطبوعة للمحلات", descEn: "Printed paper and kraft bags for shops", icon: "", art: "box", hue: 0, basePrice: 0, minQty: 100, active: true, options: [] },
  { id: "air-freshener", ar: "فواحات سيارة", en: "Car air fresheners", descAr: "فواحات معلّقة مطبوعة بشعارك", descEn: "Hanging car fresheners printed with your logo", icon: "", art: "folder", hue: 0, basePrice: 0, minQty: 100, active: true, options: [] },
  { id: "envelopes", ar: "ظروف رسمية", en: "Envelopes", descAr: "ظروف بمقاسات رسمية مطبوعة بهويتك", descEn: "Official-size envelopes printed with your identity", icon: "", art: "folder", hue: 0, basePrice: 0, minQty: 500, active: true, options: [] },
];

export function unitPrice(p: Product, sel: Record<string, string>, qty: number) {
  let u = p.basePrice;
  for (const g of p.options) { const c = g.choices.find(c => c.id === sel[g.key]); if (c) u += c.add; }
  const disc = qty >= 1000 ? 0.15 : qty >= 500 ? 0.1 : qty >= 100 ? 0.05 : 0;
  const sale = p.sale && p.sale.ends > Date.now() ? p.sale.pct / 100 : 0;
  return { unit: Math.max(0, u * (1 - disc) * (1 - sale)), disc, sale };
}

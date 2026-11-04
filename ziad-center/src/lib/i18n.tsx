import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const dict = {
  ar: {
    brand: "زياد سنتر", home: "الرئيسية", services: "خدماتنا", track: "طلباتي", admin: "الإدارة", contact: "تواصل",
    login: "تسجيل الدخول", logout: "خروج", google: "المتابعة عبر Google", email: "البريد الإلكتروني", password: "كلمة المرور",
    register: "إنشاء حساب", haveAcc: "عندي حساب", noAcc: "ما عندي حساب", name: "الاسم", phone: "رقم الهاتف", address: "العنوان",
    heroTitle1: "مطبوعات", heroTitle2: "تليق بعلامتك", heroSub: "مطبعة متكاملة: تصميم، طباعة، تغليف وتوصيل — اطلب أونلاين وتابع طلبك خطوة بخطوة.",
    orderNow: "اطلب الآن", browse: "تصفح الخدمات", why: "ليش زياد سنتر؟", fast: "سرعة بالتنفيذ", fastD: "نتابع طلبك من التصميم للتسليم",
    quality: "جودة طباعة عالية", qualityD: "أحبار وورق من أفضل الأنواع", track2: "تتبع مباشر", track2D: "تعرف وين وصل طلبك بكل لحظة",
    pay: "دفع سهل", payD: "عبر شام كاش مع تأكيد سريع", from: "ابتداءً من", config: "خصص طلبك", qty: "الكمية", notes: "ملاحظات / تفاصيل التصميم",
    customSize: "مقاس مخصص (اختياري)", unit: "سعر الوحدة", total: "الإجمالي", discount: "خصم الكمية", addCart: "أضف للسلة", cart: "السلة", empty: "السلة فارغة",
    checkout: "تأكيد الطلب", confirmOrder: "تأكيد الطلب والانتقال للدفع", remove: "حذف", attach: "إرفاق ملف التصميم (اختياري)",
    payTitle: "الدفع عبر شام كاش", payStep1: "امسح الرمز وادفع المبلغ", payStep2: "ارفع صورة الإيصال بعد الدفع", uploadReceipt: "رفع الإيصال",
    sending: "جاري الإرسال...", receiptSent: "تم إرسال الإيصال — بانتظار تأكيد الإدارة", payConfirmed: "تم تأكيد الدفع ✅",
    payRejected: "تم رفض طلبك، سيتم إعادة أموالك في أقرب وقت", account: "رقم الحساب", noQr: "لم يتم ضبط الرمز بعد",
    status: "الحالة", order: "طلب", created: "تاريخ الطلب", myOrders: "طلباتي", noOrders: "ما عندك طلبات بعد",
    s_new: "تم الاستلام", s_design: "التصميم", s_printing: "الطباعة", s_packaging: "التغليف", s_delivery: "التوصيل", s_done: "مكتمل", s_cancelled: "ملغي",
    p_unpaid: "غير مدفوع", p_pending: "بانتظار التأكيد", p_confirmed: "مدفوع", p_rejected: "مرفوض",
    dash: "لوحة التحكم", orders: "الطلبات", accounting: "المحاسبة", products: "المنتجات", settings: "الإعدادات", staff: "الفريق",
    income: "الإيرادات", expenses: "المصاريف", profit: "الصافي", addEntry: "إضافة قيد", title: "البيان", category: "التصنيف", amount: "المبلغ ($)",
    save: "حفظ", cancel: "إلغاء", rate: "سعر الصرف (ل.س لكل $)", qrImage: "صورة QR شام كاش", today: "اليوم", month: "هذا الشهر", all: "الكل",
    role: "الدور", moveTo: "نقل إلى", search: "بحث...", needAdmin: "هذه الصفحة للفريق فقط", needLogin: "سجّل دخولك أولاً", loading: "جارٍ التحميل...",
    required: "حقل مطلوب", footer: "جميع الحقوق محفوظة", openOrders: "طلبات مفتوحة", pendingPay: "دفعات بانتظار التأكيد", active: "فعّال",
    addProduct: "منتج جديد", delivered: "تم التسليم", setupTitle: "إعداد الموقع", setupDesc: "اضغط لتصبح مدير الموقع وتحميل المنتجات الافتراضية. تعمل مرة واحدة فقط.", setupBtn: "اجعلني المدير", setupDone: "تم إعداد الموقع مسبقاً.", tag: "مطبعة · تغليف · هدايا", how: "كيف يتم طلبك", st1: "اختر واطلب", st1d: "خصص المقاس والكمية بأسعار فورية", st2: "ادفع بشام كاش", st2d: "امسح الرمز وارفع الإيصال", st3: "نصمم ونطبع", st3d: "فريقنا ينفّذ ويغلّف طلبك", st4: "تتابع وتستلم", st4d: "تتبّع مباشر حتى باب بيتك", flash: "عروض فلاش", endsIn: "ينتهي خلال", d: "يوم", h: "ساعة", m: "دقيقة", s: "ثانية", salePct: "خصم %", saleEnds: "ينتهي العرض", customer: "الزبون", receipt: "الإيصال", delay: "ملاحظة",
  },
  en: {
    brand: "Ziad Center", home: "Home", services: "Services", track: "My Orders", admin: "Admin", contact: "Contact",
    login: "Sign in", logout: "Sign out", google: "Continue with Google", email: "Email", password: "Password",
    register: "Create account", haveAcc: "I have an account", noAcc: "No account yet", name: "Name", phone: "Phone", address: "Address",
    heroTitle1: "Print that", heroTitle2: "elevates your brand", heroSub: "Full-service print shop: design, print, packaging & delivery — order online and follow every step.",
    orderNow: "Order now", browse: "Browse services", why: "Why Ziad Center?", fast: "Fast turnaround", fastD: "We follow your order from design to delivery",
    quality: "Premium print quality", qualityD: "Top-grade inks and paper", track2: "Live tracking", track2D: "Know where your order is, always",
    pay: "Easy payment", payD: "Via Sham Cash with quick confirmation", from: "From", config: "Customize your order", qty: "Quantity", notes: "Notes / design details",
    customSize: "Custom size (optional)", unit: "Unit price", total: "Total", discount: "Volume discount", addCart: "Add to cart", cart: "Cart", empty: "Your cart is empty",
    checkout: "Checkout", confirmOrder: "Confirm order & pay", remove: "Remove", attach: "Attach design file (optional)",
    payTitle: "Pay with Sham Cash", payStep1: "Scan the code and pay the amount", payStep2: "Upload the receipt after paying", uploadReceipt: "Upload receipt",
    sending: "Sending...", receiptSent: "Receipt sent — awaiting admin confirmation", payConfirmed: "Payment confirmed ✅",
    payRejected: "Your order was rejected; your money will be refunded soon", account: "Account", noQr: "QR not configured yet",
    status: "Status", order: "Order", created: "Created", myOrders: "My orders", noOrders: "You have no orders yet",
    s_new: "Received", s_design: "Design", s_printing: "Printing", s_packaging: "Packaging", s_delivery: "Delivery", s_done: "Done", s_cancelled: "Cancelled",
    p_unpaid: "Unpaid", p_pending: "Pending", p_confirmed: "Paid", p_rejected: "Rejected",
    dash: "Dashboard", orders: "Orders", accounting: "Accounting", products: "Products", settings: "Settings", staff: "Team",
    income: "Income", expenses: "Expenses", profit: "Net", addEntry: "Add entry", title: "Title", category: "Category", amount: "Amount ($)",
    save: "Save", cancel: "Cancel", rate: "Exchange rate (SYP per $)", qrImage: "Sham Cash QR image", today: "Today", month: "This month", all: "All",
    role: "Role", moveTo: "Move to", search: "Search...", needAdmin: "Staff only", needLogin: "Please sign in first", loading: "Loading...",
    required: "Required", footer: "All rights reserved", openOrders: "Open orders", pendingPay: "Payments awaiting", active: "Active",
    addProduct: "New product", delivered: "Delivered", setupTitle: "Site setup", setupDesc: "Click to become the site admin and load default products. Works once only.", setupBtn: "Make me admin", setupDone: "Site already set up.", tag: "PRINT · PACKAGING · GIFTS", how: "How it works", st1: "Pick & order", st1d: "Customize size and quantity with instant prices", st2: "Pay via Sham Cash", st2d: "Scan the code and upload the receipt", st3: "We design & print", st3d: "Our team produces and packs your order", st4: "Track & receive", st4d: "Live tracking to your door", flash: "Flash Deals", endsIn: "Ends in", d: "Days", h: "Hours", m: "Min", s: "Sec", salePct: "Discount %", saleEnds: "Sale ends", customer: "Customer", receipt: "Receipt", delay: "Note",
  },
} as const;
export type Lang = "ar" | "en";
export type Key = keyof typeof dict.ar;
export type Cur = "USD" | "SYP";

interface Ctx { lang: Lang; setLang(l: Lang): void; t(k: Key): string; cur: Cur; setCur(c: Cur): void; money(usd: number, rate: number): string; pick<T extends { ar: string; en: string }>(o: T): string }
const I18n = createContext<Ctx>(null as never);
const ls = (k: string, d: string) => { try { return localStorage.getItem(k) || d; } catch { return d; } };

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(ls("lang", "ar") as Lang);
  const [cur, setCur] = useState<Cur>(ls("cur", "SYP") as Cur);
  useEffect(() => {
    document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("lang", lang); } catch {}
  }, [lang]);
  useEffect(() => { try { localStorage.setItem("cur", cur); } catch {} }, [cur]);
  const value: Ctx = {
    lang, setLang, cur, setCur,
    t: k => dict[lang][k] ?? k,
    pick: o => (lang === "ar" ? o.ar : o.en),
    money: (usd, rate) => cur === "USD"
      ? `$${usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
      : `${(Math.round(usd * rate / 500) * 500).toLocaleString(lang === "ar" ? "ar-SY" : "en-US")} ${lang === "ar" ? "ل.س" : "SYP"}`,
  };
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}
export const useI18n = () => useContext(I18n);

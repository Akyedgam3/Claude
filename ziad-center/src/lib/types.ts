export type Role = "customer" | "admin" | "designer" | "press" | "packing" | "accountant";
export const STAFF: Role[] = ["admin", "designer", "press", "packing", "accountant"];

export type Stage = "new" | "design" | "printing" | "packaging" | "delivery" | "done" | "cancelled";
export const STAGES: Stage[] = ["new", "design", "printing", "packaging", "delivery", "done"];
// أي دور يحق له تحريك أي مرحلة
export const STAGE_ROLE: Record<Stage, Role[]> = {
  new: ["admin"], design: ["admin", "designer"], printing: ["admin", "press"],
  packaging: ["admin", "packing"], delivery: ["admin", "packing"], done: ["admin"], cancelled: ["admin"],
};

export type PayStatus = "unpaid" | "pending" | "confirmed" | "rejected";

export interface Choice { id: string; ar: string; en: string; add: number }
export interface OptionGroup { key: string; ar: string; en: string; choices: Choice[] }
export interface Product {
  id: string; ar: string; en: string; descAr: string; descEn: string;
  icon: string; image?: string; hue: number; basePrice: number; minQty: number; options: OptionGroup[]; active: boolean;
  code?: string; // كود المنتج الظاهر للزبون
  art?: string; // رسمة بديلة من قطع الرف عند عدم وجود صورة
  sale?: { pct: number; ends: number }; // عرض فلاش: نسبة الخصم + وقت الانتهاء (ms)
}
export interface OrderItem {
  productId: string; name: string; options: Record<string, string>; qty: number;
  unitUSD: number; totalUSD: number; notes?: string; customSize?: string;
}
export interface HistoryEntry { stage: Stage | "payment"; at: number; by: string; note?: string }
export interface Order {
  id: string; code: string; uid: string; customerName: string; phone: string; address: string;
  items: OrderItem[]; totalUSD: number; rate: number; stage: Stage;
  payment: { status: PayStatus; receiptAt?: number; rejectReason?: string };
  history: HistoryEntry[]; designFile?: string; createdAt: number;
}
export interface LedgerEntry {
  id: string; type: "income" | "expense"; amountUSD: number; title: string;
  category: string; orderId?: string; date: number; by: string;
}
export interface Settings {
  usdToSyp: number; shamcashQr: string; shamcashAccount: string;
  phone: string; whatsapp: string; address: string;
  email: string; aboutAr: string; aboutEn: string; shippingAr: string; shippingEn: string;
  facebook: string; instagram: string; tiktok: string; telegram: string;
  markets: string; // سطر لكل سوق: المدينة | الهاتف | المسؤول
}
export const DEFAULT_SETTINGS: Settings = {
  usdToSyp: 13000, shamcashQr: "", shamcashAccount: "", phone: "", whatsapp: "", address: "",
  email: "", aboutAr: "", aboutEn: "", shippingAr: "", shippingEn: "",
  facebook: "", instagram: "", tiktok: "", telegram: "", markets: "",
};

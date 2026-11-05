// كتل ألوان الطباعة (CMYK) لخلفيات صور/رسومات المنتجات
export const BLOCKS = ["#67e8f9", "#fde047", "#f9a8d4", "#fdba74", "#0b1633", "#a7f3d0"];
const FIXED: Record<string, number> = { cards: 0, flyers: 1, banners: 2, stickers: 3, boxes: 5, mugs: 1, rollup: 0, design: 4 };
export function blockOf(id: string) {
  if (id in FIXED) return BLOCKS[FIXED[id]];
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % BLOCKS.length; return BLOCKS[h];
}

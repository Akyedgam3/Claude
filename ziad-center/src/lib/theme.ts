// كتل ألوان الطباعة (CMYK) لخلفيات صور/رسومات المنتجات
export const BLOCKS = ["#dce3f0", "#edeae5", "#c9d3ea", "#d4f0f1", "#0d244c", "#e6ecf7"];
const FIXED: Record<string, number> = { cards: 0, flyers: 1, banners: 2, stickers: 3, boxes: 5, mugs: 1, rollup: 0, design: 4 };
export function blockOf(id: string) {
  if (id in FIXED) return BLOCKS[FIXED[id]];
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % BLOCKS.length; return BLOCKS[h];
}

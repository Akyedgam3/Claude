import type { Product } from "../lib/types";
import Art, { hasArt } from "./Art";
import ShelfItem, { SHELF } from "./ShelfArt";
import Icon from "./Icon";

/** صورة المنتج الحقيقية، وإلا رسمته، وإلا قطعة رف مناسبة، وإلا أيقونة */
export default function ProductVisual({ p, className = "", pad = "p-4" }: { p: Product; className?: string; pad?: string }) {
  if (p.image) return <img src={p.image} alt="" loading="lazy" className={`absolute inset-0 w-full h-full object-cover ${className}`} />;
  if (hasArt(p.id)) return <Art id={p.id} className={`relative w-full h-full ${pad} ${className}`} />;
  if (p.art && p.art in SHELF) return <ShelfItem k={p.art as keyof typeof SHELF} className={`relative w-full h-full ${pad} ${className}`} />;
  return <Icon n="box" size={64} className={`relative text-ink/60 ${className}`} />;
}

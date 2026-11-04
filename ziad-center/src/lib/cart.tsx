import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { OrderItem } from "./types";
interface C { items: OrderItem[]; add(i: OrderItem): void; remove(n: number): void; clear(): void; total: number }
const Ctx = createContext<C>(null as never);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>(() => { try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem("cart", JSON.stringify(items)); } catch {} }, [items]);
  return <Ctx.Provider value={{ items, add: i => setItems(s => [...s, i]), remove: n => setItems(s => s.filter((_, x) => x !== n)), clear: () => setItems([]), total: items.reduce((a, i) => a + i.totalUSD, 0) }}>{children}</Ctx.Provider>;
}
export const useCart = () => useContext(Ctx);

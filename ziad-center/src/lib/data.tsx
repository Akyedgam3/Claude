import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { collection, doc, onSnapshot, orderBy, query, where, type Query } from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_SETTINGS, type Order, type Product, type Settings } from "./types";
import { SEED_PRODUCTS } from "./catalog";

interface D { settings: Settings; products: Product[] }
const Ctx = createContext<D>({ settings: DEFAULT_SETTINGS, products: SEED_PRODUCTS });

export function DataProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  useEffect(() => {
    const a = onSnapshot(doc(db, "settings", "main"), s => s.exists() && setSettings({ ...DEFAULT_SETTINGS, ...(s.data() as Settings) }), () => {});
    const b = onSnapshot(collection(db, "products"), s => {
      if (!s.empty) setProducts(s.docs.map(d => ({ ...(d.data() as Product), id: d.id })).filter(p => p.active !== false));
    }, () => {});
    return () => { a(); b(); };
  }, []);
  return <Ctx.Provider value={{ settings, products }}>{children}</Ctx.Provider>;
}
export const useData = () => useContext(Ctx);

export function useQuery<T>(make: () => Query | null, deps: unknown[]): { rows: T[]; loading: boolean } {
  const [rows, setRows] = useState<T[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = make(); if (!q) { setRows([]); setLoading(false); return; }
    return onSnapshot(q, s => { setRows(s.docs.map(d => ({ ...(d.data() as object), id: d.id }) as T)); setLoading(false); }, () => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { rows, loading };
}
export const useMyOrders = (uid?: string) => useQuery<Order>(() => uid ? query(collection(db, "orders"), where("uid", "==", uid), orderBy("createdAt", "desc")) : null, [uid]);
export const useAllOrders = (enabled: boolean) => useQuery<Order>(() => enabled ? query(collection(db, "orders"), orderBy("createdAt", "desc")) : null, [enabled]);

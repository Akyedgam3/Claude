// مزايا إضافية: المفضلة، شوهد مؤخراً، والإشعارات المنبثقة — محفوظة محلياً بمتصفح الزائر
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

const load = (k: string): string[] => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
const save = (k: string, v: string[]) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* تخزين غير متاح */ } };

interface X {
  favs: string[]; toggleFav(id: string): void; isFav(id: string): boolean;
  recent: string[]; pushRecent(id: string): void;
  toast(msg: string): void;
}
const Ctx = createContext<X>(null as never);

export function ExtrasProvider({ children }: { children: ReactNode }) {
  const [favs, setFavs] = useState<string[]>(() => load("favs"));
  const [recent, setRecent] = useState<string[]>(() => load("recent"));
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  useEffect(() => save("favs", favs), [favs]);
  useEffect(() => save("recent", recent), [recent]);
  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  }, []);
  const v: X = {
    favs, isFav: id => favs.includes(id),
    toggleFav: id => setFavs(f => (f.includes(id) ? f.filter(x => x !== id) : [id, ...f])),
    recent, pushRecent: useCallback((id: string) => setRecent(r => [id, ...r.filter(x => x !== id)].slice(0, 8)), []),
    toast,
  };
  return (
    <Ctx.Provider value={v}>
      {children}
      <div className="fixed z-[70] bottom-24 sm:bottom-6 inset-x-0 flex flex-col items-center gap-2 pointer-events-none" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
              className="bg-ink text-white text-sm font-medium rounded-full px-5 py-3 shadow-xl flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path d="M5 12l5 5L20 7" fill="none" stroke="#50c4c8" strokeWidth="3" /></svg>{t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
export const useExtras = () => useContext(Ctx);

export function Heart({ id, className = "" }: { id: string; className?: string }) {
  const { isFav, toggleFav, toast } = useExtras(); const on = isFav(id);
  const ar = document.documentElement.lang === "ar";
  return (
    <button type="button" aria-pressed={on} aria-label={ar ? "المفضلة" : "Favourite"}
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFav(id); toast(on ? (ar ? "أُزيل من المفضلة" : "Removed from favourites") : (ar ? "أُضيف للمفضلة" : "Added to favourites")); }}
      className={`grid place-items-center w-10 h-10 rounded-full bg-white/90 shadow-sm hover:scale-110 active:scale-95 transition ${className}`}>
      <motion.svg key={String(on)} initial={{ scale: .6 }} animate={{ scale: 1 }} width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.600A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" fill={on ? "#e11d48" : "none"} stroke={on ? "#e11d48" : "#0d244c"} strokeWidth="1.800" strokeLinejoin="round" />
      </motion.svg>
    </button>
  );
}

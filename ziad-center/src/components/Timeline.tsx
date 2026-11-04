import { motion } from "framer-motion";
import { useI18n, type Key } from "../lib/i18n";
import { STAGES, type Order } from "../lib/types";

export default function Timeline({ order }: { order: Order }) {
  const { t, lang } = useI18n();
  const cancelled = order.stage === "cancelled";
  const idx = STAGES.indexOf(order.stage);
  return (
    <div>
      <div className="flex items-center">
        {STAGES.map((s, i) => {
          const done = !cancelled && i <= idx;
          return (
            <div key={s} className="flex-1 flex flex-col items-center relative">
              {i > 0 && <div className="absolute top-4 end-1/2 w-full h-0.5 bg-line"><motion.div className="h-full bg-gradient-to-r from-cyan to-magenta" initial={{ width: 0 }} animate={{ width: done ? "100%" : 0 }} transition={{ duration: .6, delay: i * .1 }} /></div>}
              <motion.div initial={{ scale: .6 }} animate={{ scale: i === idx && !cancelled ? 1.2 : 1 }} className={`relative z-10 w-8 h-8 rounded-full grid place-items-center text-sm font-bold border-2 ${done ? "bg-cyan border-cyan text-ink" : "bg-ink border-line text-slate-500"}`}>{done ? "✓" : i + 1}</motion.div>
              <span className={`text-[11px] sm:text-xs mt-2 text-center ${done ? "text-white" : "text-slate-500"}`}>{t(`s_${s}` as Key)}</span>
            </div>
          );
        })}
      </div>
      {cancelled && <p className="mt-4 text-center text-rose-400 font-bold">{t("s_cancelled")}</p>}
      <ul className="mt-6 space-y-2 text-sm text-slate-300">
        {[...order.history].reverse().map((h, i) => (
          <li key={i} className="flex gap-2"><span className="text-slate-500 tabular-nums">{new Date(h.at).toLocaleString(lang === "ar" ? "ar-SY" : "en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
            <span>{h.stage === "payment" ? t("pay") : t(`s_${h.stage}` as Key)}{h.note ? ` — ${h.note}` : ""}</span></li>
        ))}
      </ul>
    </div>
  );
}

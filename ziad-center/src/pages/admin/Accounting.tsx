import { useState } from "react";
import { collection, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useI18n } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import { useData, useQuery } from "../../lib/data";
import { addLedger } from "../../lib/api";
import type { LedgerEntry } from "../../lib/types";
import { Page } from "../../components/Page";

export default function Accounting() {
  const { t, money } = useI18n(); const { user } = useAuth(); const { settings } = useData();
  const { rows } = useQuery<LedgerEntry>(() => query(collection(db, "ledger"), orderBy("date", "desc")), []);
  const [range, setRange] = useState<"today" | "month" | "all">("month");
  const [f, setF] = useState({ type: "expense" as "income" | "expense", title: "", category: "", amount: "" });
  const start = range === "all" ? 0 : (() => { const d = new Date(); if (range === "month") d.setDate(1); d.setHours(0, 0, 0, 0); return +d; })();
  const list = rows.filter(r => r.date >= start);
  const inc = list.filter(r => r.type === "income").reduce((a, r) => a + r.amountUSD, 0);
  const exp = list.filter(r => r.type === "expense").reduce((a, r) => a + r.amountUSD, 0);
  const rate = settings.usdToSyp;
  const add = async () => {
    const amountUSD = +f.amount; if (!f.title || !amountUSD) return;
    await addLedger({ type: f.type, title: f.title, category: f.category || "general", amountUSD, date: Date.now(), by: user?.email || "" });
    setF({ ...f, title: "", amount: "" });
  };
  const csv = () => {
    const body = ["date,type,title,category,amountUSD", ...list.map(r => [new Date(r.date).toISOString().slice(0, 10), r.type, `"${r.title}"`, r.category, r.amountUSD].join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv" })); a.download = "ledger.csv"; a.click();
  };
  return (
    <Page className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3"><h1 className="text-3xl font-extrabold">{t("accounting")}</h1>
        <div className="flex gap-2">{(["today", "month", "all"] as const).map(r => <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-full text-xs border ${range === r ? "border-gold text-gold" : "border-line text-slate-400"}`}>{t(r)}</button>)}<button className="btn btn-ghost !py-1 text-xs" onClick={csv}>CSV</button></div></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4"><div className="text-sm text-slate-400">{t("income")}</div><div className="text-2xl font-extrabold text-emerald-400">{money(inc, rate)}</div></div>
        <div className="card p-4"><div className="text-sm text-slate-400">{t("expenses")}</div><div className="text-2xl font-extrabold text-rose-400">{money(exp, rate)}</div></div>
        <div className="card p-4"><div className="text-sm text-slate-400">{t("profit")}</div><div className={`text-2xl font-extrabold ${inc - exp >= 0 ? "text-gold" : "text-rose-400"}`}>{money(inc - exp, rate)}</div></div>
      </div>
      <div className="card p-4 grid sm:grid-cols-5 gap-2 items-end">
        <select className="input" value={f.type} onChange={e => setF({ ...f, type: e.target.value as "income" | "expense" })}><option value="expense">{t("expenses")}</option><option value="income">{t("income")}</option></select>
        <input className="input sm:col-span-2" placeholder={t("title")} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
        <input className="input" placeholder={t("category")} value={f.category} onChange={e => setF({ ...f, category: e.target.value })} />
        <div className="flex gap-2"><input className="input" type="number" placeholder={t("amount")} value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /><button className="btn btn-primary" onClick={add}>+</button></div>
      </div>
      <div className="card divide-y divide-line">
        {list.map(r => <div key={r.id} className="p-3 flex items-center gap-3 text-sm"><span className="text-slate-500 w-24">{new Date(r.date).toLocaleDateString("en-GB")}</span><span className="flex-1">{r.title} <span className="text-slate-500">· {r.category}</span></span>
          <b className={r.type === "income" ? "text-emerald-400" : "text-rose-400"}>{r.type === "income" ? "+" : "-"}{money(r.amountUSD, rate)}</b>
          <button className="text-slate-500 hover:text-rose-400" onClick={() => confirm("Delete?") && deleteDoc(doc(db, "ledger", r.id))}>✕</button></div>)}
      </div>
    </Page>
  );
}

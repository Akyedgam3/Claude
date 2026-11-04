import { useState } from "react";
import { collection, deleteDoc, doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useI18n } from "../../lib/i18n";
import { useData } from "../../lib/data";
import { SEED_PRODUCTS } from "../../lib/catalog";
import type { Product } from "../../lib/types";
import { Page } from "../../components/Page";

export default function AdminProducts() {
  const { t, pick } = useI18n(); const { products } = useData();
  const [edit, setEdit] = useState<Product | null>(null); const [json, setJson] = useState("");
  const open = (p: Product) => { setEdit(p); setJson(JSON.stringify(p.options, null, 1)); };
  const save = async () => {
    if (!edit) return; const { id, ...rest } = edit;
    await setDoc(doc(db, "products", id), { ...rest, options: JSON.parse(json) }); setEdit(null);
  };
  const seed = async () => { const b = writeBatch(db); SEED_PRODUCTS.forEach(({ id, ...p }) => b.set(doc(collection(db, "products"), id), p)); await b.commit(); };
  const blank: Product = { id: "p" + Date.now(), ar: "", en: "", descAr: "", descEn: "", icon: "🖨️", hue: 200, basePrice: 1, minQty: 1, options: [], active: true };
  return (
    <Page className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-extrabold">{t("products")}</h1>
        <div className="flex gap-2"><button className="btn btn-ghost" onClick={seed}>⬆ Seed</button><button className="btn btn-primary" onClick={() => open(blank)}>+ {t("addProduct")}</button></div></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map(p => <div key={p.id} className="card p-4 flex items-center gap-3"><span className="text-3xl">{p.icon}</span><div className="flex-1"><b>{pick(p)}</b><div className="text-xs text-slate-400">${p.basePrice} · min {p.minQty}</div></div>
          <button className="btn btn-ghost !py-1 text-xs" onClick={() => open(p)}>✎</button><button className="text-rose-400" onClick={() => confirm("Delete?") && deleteDoc(doc(db, "products", p.id))}>✕</button></div>)}
      </div>
      {edit && (
        <div className="fixed inset-0 bg-black/70 z-50 grid place-items-center p-4" onClick={() => setEdit(null)}>
          <div className="card p-5 w-full max-w-xl max-h-[90vh] overflow-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-2">
              {(["ar", "en", "descAr", "descEn", "icon"] as const).map(k => <div key={k}><label className="label">{k}</label><input className="input" value={edit[k]} onChange={e => setEdit({ ...edit, [k]: e.target.value })} /></div>)}
              <div><label className="label">basePrice $</label><input className="input" type="number" step="0.001" value={edit.basePrice} onChange={e => setEdit({ ...edit, basePrice: +e.target.value })} /></div>
              <div><label className="label">minQty</label><input className="input" type="number" value={edit.minQty} onChange={e => setEdit({ ...edit, minQty: +e.target.value })} /></div>
              <div><label className="label">hue</label><input className="input" type="number" value={edit.hue} onChange={e => setEdit({ ...edit, hue: +e.target.value })} /></div>
              <div><label className="label">{t("salePct")}</label><input className="input" type="number" value={edit.sale?.pct ?? 0} onChange={e => setEdit({ ...edit, sale: { pct: +e.target.value, ends: edit.sale?.ends ?? Date.now() + 7 * 864e5 } })} /></div>
              <div><label className="label">{t("saleEnds")}</label><input className="input" type="datetime-local" value={edit.sale ? new Date(edit.sale.ends - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : ""} onChange={e => setEdit({ ...edit, sale: { pct: edit.sale?.pct ?? 0, ends: +new Date(e.target.value) } })} /></div>
              <label className="flex items-center gap-2 mt-6"><input type="checkbox" checked={edit.active} onChange={e => setEdit({ ...edit, active: e.target.checked })} /> {t("active")}</label>
            </div>
            <label className="label">options (JSON)</label><textarea className="input font-mono text-xs" dir="ltr" rows={8} value={json} onChange={e => setJson(e.target.value)} />
            <div className="flex gap-2"><button className="btn btn-primary" onClick={save}>{t("save")}</button><button className="btn btn-ghost" onClick={() => setEdit(null)}>{t("cancel")}</button></div>
          </div>
        </div>
      )}
    </Page>
  );
}

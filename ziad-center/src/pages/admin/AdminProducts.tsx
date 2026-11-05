import { useState } from "react";
import { collection, deleteDoc, doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useI18n } from "../../lib/i18n";
import { useData } from "../../lib/data";
import { compressImage } from "../../lib/api";
import { SEED_PRODUCTS } from "../../lib/catalog";
import type { OptionGroup, Product } from "../../lib/types";
import { Page } from "../../components/Page";
import Icon from "../../components/Icon";

export default function AdminProducts() {
  const { t, pick } = useI18n(); const { products } = useData();
  const [edit, setEdit] = useState<Product | null>(null);
  const open = (p: Product) => setEdit(structuredClone(p));
  const save = async () => {
    if (!edit) return; const { id, ...rest } = edit;
    await setDoc(doc(db, "products", id), JSON.parse(JSON.stringify(rest))); setEdit(null);
  };
  const seed = async () => { const b = writeBatch(db); SEED_PRODUCTS.forEach(({ id, ...p }) => b.set(doc(collection(db, "products"), id), p)); await b.commit(); };
  const blank: Product = { id: "p" + Date.now(), ar: "", en: "", descAr: "", descEn: "", icon: "", hue: 200, basePrice: 1, minQty: 1, options: [], active: true };
  return (
    <Page className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-extrabold">{t("products")}</h1>
        <div className="flex gap-2"><button className="btn btn-ghost" onClick={seed}>Seed</button><button className="btn btn-primary" onClick={() => open(blank)}>+ {t("addProduct")}</button></div></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map(p => <div key={p.id} className="card p-4 flex items-center gap-3"><Icon n="box" size={28} className="text-gold" /><div className="flex-1"><b>{pick(p)}</b><div className="text-xs text-slate-600">${p.basePrice} · min {p.minQty}</div></div>
          <button className="btn btn-ghost !py-1 text-xs" onClick={() => open(p)} aria-label="Edit"><Icon n="edit" size={16} /></button><button className="text-rose-400" onClick={() => confirm("Delete?") && deleteDoc(doc(db, "products", p.id))}><Icon n="close" size={16} /></button></div>)}
      </div>
      {edit && (
        <div className="fixed inset-0 bg-black/70 z-50 grid place-items-center p-4" onClick={() => setEdit(null)}>
          <div className="card p-5 w-full max-w-xl max-h-[90vh] overflow-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-2">
              {(["ar", "en", "descAr", "descEn"] as const).map(k => <div key={k}><label className="label">{k}</label><input className="input" value={edit[k]} onChange={e => setEdit({ ...edit, [k]: e.target.value })} /></div>)}
              <div><label className="label">basePrice $</label><input className="input" type="number" step="0.001" value={edit.basePrice} onChange={e => setEdit({ ...edit, basePrice: +e.target.value })} /></div>
              <div><label className="label">minQty</label><input className="input" type="number" value={edit.minQty} onChange={e => setEdit({ ...edit, minQty: +e.target.value })} /></div>
              <div><label className="label">hue</label><input className="input" type="number" value={edit.hue} onChange={e => setEdit({ ...edit, hue: +e.target.value })} /></div>
              <div><label className="label">{t("salePct")}</label><input className="input" type="number" value={edit.sale?.pct ?? 0} onChange={e => setEdit({ ...edit, sale: { pct: +e.target.value, ends: edit.sale?.ends ?? Date.now() + 7 * 864e5 } })} /></div>
              <div><label className="label">{t("saleEnds")}</label><input className="input" type="datetime-local" value={edit.sale ? new Date(edit.sale.ends - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : ""} onChange={e => setEdit({ ...edit, sale: { pct: edit.sale?.pct ?? 0, ends: +new Date(e.target.value) } })} /></div>
              <label className="flex items-center gap-2 mt-6"><input type="checkbox" checked={edit.active} onChange={e => setEdit({ ...edit, active: e.target.checked })} /> {t("active")}</label>
            </div>
            <div><label className="label">{t("productImage")}</label>
              <input className="input" type="file" accept="image/*" onChange={async e => { const f = e.target.files?.[0]; if (f) setEdit({ ...edit, image: await compressImage(f, 900, true) }); }} />
              {edit.image && <div className="flex items-center gap-3 mt-2"><img src={edit.image} alt="" className="w-28 h-20 object-cover rounded-lg" /><button className="text-sm text-rose-400" onClick={() => setEdit({ ...edit, image: "" })}>{t("remove")}</button></div>}</div>
            <OptionsEditor value={edit.options} onChange={options => setEdit({ ...edit, options })} />
            <div className="flex gap-2"><button className="btn btn-primary" onClick={save}>{t("save")}</button><button className="btn btn-ghost" onClick={() => setEdit(null)}>{t("cancel")}</button></div>
          </div>
        </div>
      )}
    </Page>
  );
}

function OptionsEditor({ value, onChange }: { value: OptionGroup[]; onChange(v: OptionGroup[]): void }) {
  const set = (gi: number, g: OptionGroup) => onChange(value.map((x, i) => i === gi ? g : x));
  return (
    <div className="space-y-3">
      {value.map((g, gi) => (
        <div key={gi} className="rounded-xl border border-line p-3 space-y-2">
          <div className="flex gap-2"><input className="input" placeholder="عربي" value={g.ar} onChange={e => set(gi, { ...g, ar: e.target.value, key: g.key || "o" + gi })} /><input className="input" placeholder="English" value={g.en} onChange={e => set(gi, { ...g, en: e.target.value })} /><button className="text-rose-400" onClick={() => onChange(value.filter((_, i) => i !== gi))}><Icon n="close" size={16} /></button></div>
          {g.choices.map((c, ci) => (
            <div key={ci} className="flex gap-2 items-center ps-4">
              <input className="input" placeholder="عربي" value={c.ar} onChange={e => set(gi, { ...g, choices: g.choices.map((x, i) => i === ci ? { ...x, ar: e.target.value, id: x.id || "c" + ci } : x) })} />
              <input className="input" placeholder="English" value={c.en} onChange={e => set(gi, { ...g, choices: g.choices.map((x, i) => i === ci ? { ...x, en: e.target.value } : x) })} />
              <input className="input !w-24" type="number" step="0.001" title="+$" value={c.add} onChange={e => set(gi, { ...g, choices: g.choices.map((x, i) => i === ci ? { ...x, add: +e.target.value } : x) })} />
              <button className="text-rose-400" onClick={() => set(gi, { ...g, choices: g.choices.filter((_, i) => i !== ci) })}><Icon n="close" size={16} /></button>
            </div>))}
          <button className="text-xs text-gold ps-4" onClick={() => set(gi, { ...g, choices: [...g.choices, { id: "c" + g.choices.length, ar: "", en: "", add: 0 }] })}>+ خيار / choice</button>
        </div>))}
      <button className="btn btn-ghost !py-1 text-sm" onClick={() => onChange([...value, { key: "o" + value.length, ar: "", en: "", choices: [{ id: "c0", ar: "", en: "", add: 0 }] }])}>+ مجموعة خيارات / option group</button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useI18n } from "../../lib/i18n";
import { useData, useQuery } from "../../lib/data";
import { compressImage } from "../../lib/api";
import { DEFAULT_SETTINGS, type Role, type Settings } from "../../lib/types";
import { Page } from "../../components/Page";

const ROLES: Role[] = ["customer", "designer", "press", "packing", "accountant", "admin"];
export default function AdminSettings() {
  const { t } = useI18n(); const { settings } = useData();
  const [s, setS] = useState<Settings>(settings); const [saved, setSaved] = useState(false);
  useEffect(() => setS(settings), [settings]);
  const { rows: users } = useQuery<{ id: string; name: string; email: string; role: Role }>(() => collection(db, "users"), []);
  const save = async () => { await setDoc(doc(db, "settings", "main"), { ...DEFAULT_SETTINGS, ...s }); setSaved(true); setTimeout(() => setSaved(false), 1500); };
  return (
    <Page className="space-y-8 max-w-3xl">
      <h1 className="text-3xl font-extrabold">{t("settings")}</h1>
      <div className="card p-5 space-y-3">
        <div><label className="label">{t("rate")}</label><input className="input" type="number" value={s.usdToSyp} onChange={e => setS({ ...s, usdToSyp: +e.target.value })} /></div>
        <div><label className="label">{t("qrImage")}</label>
          <input className="input" type="file" accept="image/*" onChange={async e => { const f = e.target.files?.[0]; if (f) setS({ ...s, shamcashQr: await compressImage(f) }); }} />
          {s.shamcashQr && <img src={s.shamcashQr} className="w-40 h-40 mt-3 bg-white rounded-xl p-2 object-contain" alt="QR" />}</div>
        <div><label className="label">{t("account")} (Sham Cash)</label><input className="input" dir="ltr" value={s.shamcashAccount} onChange={e => setS({ ...s, shamcashAccount: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="label">{t("phone")}</label><input className="input" dir="ltr" value={s.phone} onChange={e => setS({ ...s, phone: e.target.value })} /></div>
          <div><label className="label">WhatsApp</label><input className="input" dir="ltr" value={s.whatsapp} onChange={e => setS({ ...s, whatsapp: e.target.value })} /></div></div>
        <button className="btn btn-primary" onClick={save}>{saved ? "✓" : t("save")}</button>
      </div>
      <div className="card p-5">
        <h2 className="font-extrabold mb-3">{t("staff")}</h2>
        <div className="divide-y divide-line">{users.map(u => <div key={u.id} className="py-2 flex items-center gap-3 text-sm"><span className="flex-1">{u.name} <span className="text-slate-500" dir="ltr">{u.email}</span></span>
          <select className="input !w-36" value={u.role} onChange={e => updateDoc(doc(db, "users", u.id), { role: e.target.value })}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>)}</div>
      </div>
    </Page>
  );
}

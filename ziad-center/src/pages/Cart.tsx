import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { useData } from "../lib/data";
import { createOrder, uploadDesign } from "../lib/api";
import { Page } from "../components/Page";
import Icon from "../components/Icon";

export default function Cart() {
  const { t, pick, money, lang } = useI18n(); const { user } = useAuth(); const cart = useCart(); const { settings, products } = useData(); const nav = useNavigate();
  const [f, setF] = useState({ name: user?.displayName || "", phone: "", address: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  if (!cart.items.length) return <Page className="text-center py-24"><Icon n="cart" size={56} className="mx-auto mb-4 text-gold" /><p className="text-slate-600 mb-6">{t("empty")}</p><Link to="/services" className="btn btn-primary">{t("browse")}</Link></Page>;
  const submit = async () => {
    if (!user) return nav("/login?next=/cart");
    if (!f.name || !f.phone || !f.address) return setErr(t("required"));
    setBusy(true); setErr("");
    try {
      let designFile: string | undefined;
      if (file) designFile = (await uploadDesign(file)).name;
      const id = await createOrder({ uid: user.uid, customerName: f.name, phone: f.phone, address: f.address, items: cart.items, rate: settings.usdToSyp, designFile });
      cart.clear(); nav(`/orders/${id}`);
    } catch (e) { setErr(String((e as Error).message)); setBusy(false); }
  };
  return (
    <Page className="max-w-5xl mx-auto px-4 pt-10 grid md:grid-cols-5 gap-6">
      <div className="md:col-span-3 space-y-3">
        <h1 className="text-3xl font-extrabold mb-2">{t("cart")}</h1>
        {cart.items.map((i, n) => {
          const p = products.find(x => x.id === i.productId);
          return (
            <div key={n} className="card p-4 flex gap-4 items-center">
              <div className="text-4xl">{p?.icon}</div>
              <div className="flex-1 text-sm">
                <b className="text-base">{p ? pick(p) : i.name}</b>
                <div className="text-slate-600">{t("qty")}: {i.qty} {i.customSize && `• ${i.customSize}`}</div>
                {i.notes && <div className="text-slate-600 italic">{i.notes}</div>}
              </div>
              <div className="text-end"><b className="text-gold">{money(i.totalUSD, settings.usdToSyp)}</b><button onClick={() => cart.remove(n)} className="block text-xs text-rose-400 mt-1">{t("remove")}</button></div>
            </div>
          );
        })}
      </div>
      <div className="md:col-span-2 card p-5 space-y-3 h-fit">
        <h2 className="font-extrabold text-xl">{t("checkout")}</h2>
        <div><label className="label">{t("name")}</label><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label">{t("phone")}</label><input className="input" dir="ltr" inputMode="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
        <div><label className="label">{t("address")}</label><textarea className="input" rows={2} value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></div>
        <div><label className="label">{t("attach")}</label><input className="input" type="file" accept="image/*,.pdf,.zip,.ai,.psd" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
        <div className="flex justify-between text-xl font-extrabold pt-2 border-t border-line"><span>{t("total")}</span><span>{money(cart.total, settings.usdToSyp)}</span></div>
        {lang && err && <p className="text-rose-400 text-sm">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy} onClick={submit}>{busy ? t("sending") : t("confirmOrder")}</button>
      </div>
    </Page>
  );
}

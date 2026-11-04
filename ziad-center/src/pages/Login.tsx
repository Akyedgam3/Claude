import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { Page } from "../components/Page";
import Logo from "../components/Logo";

export default function Login() {
  const { t } = useI18n(); const a = useAuth(); const nav = useNavigate(); const [sp] = useSearchParams();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ name: "", email: "", pass: "" }); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const done = () => nav(sp.get("next") || "/");
  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(""); try { await fn(); done(); } catch (e) { setErr((e as Error).message.replace("Firebase: ", "")); } setBusy(false); };
  return (
    <Page className="max-w-md mx-auto px-4 pt-14">
      <div className="card p-7 space-y-4">
        <div className="flex justify-center"><Logo size={56} /></div>
        <h1 className="text-2xl font-extrabold text-center">{mode === "in" ? t("login") : t("register")}</h1>
        <button className="btn btn-ghost w-full" disabled={busy} onClick={() => run(a.google)}><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" /><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C.9 16.4 0 20.100 0 24s.9 7.600 2.600 10.800l7.900-6.200z" /><path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.400-5.700c-2.100 1.400-4.800 2.300-8.500 2.300-6.300 0-11.600-4.100-13.500-9.900l-7.900 6.200C6.500 42.600 14.600 48 24 48z" /></svg>{t("google")}</button>
        <div className="text-center text-xs text-slate-500">— or —</div>
        {mode === "up" && <div><label className="label">{t("name")}</label><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>}
        <div><label className="label">{t("email")}</label><input className="input" type="email" dir="ltr" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label">{t("password")}</label><input className="input" type="password" dir="ltr" value={f.pass} onChange={e => setF({ ...f, pass: e.target.value })} /></div>
        {err && <p className="text-rose-400 text-sm">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy} onClick={() => run(() => mode === "in" ? a.login(f.email, f.pass) : a.register(f.name, f.email, f.pass))}>{mode === "in" ? t("login") : t("register")}</button>
        <button className="text-sm text-slate-400 w-full" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? t("noAcc") : t("haveAcc")}</button>
      </div>
    </Page>
  );
}

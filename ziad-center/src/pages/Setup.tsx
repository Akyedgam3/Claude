import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { collection, doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { SEED_PRODUCTS } from "../lib/catalog";
import { DEFAULT_SETTINGS } from "../lib/types";
import { Page } from "../components/Page";

// أول حساب يفتح هذه الصفحة قبل وجود مالك يصبح مديراً + تُحمَّل المنتجات الافتراضية. بعدها تُقفل الصفحة.
export default function Setup() {
  const { user, ready, role } = useAuth(); const { t } = useI18n();
  const [free, setFree] = useState<boolean | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [done, setDone] = useState(false);
  useEffect(() => { getDoc(doc(db, "config", "owner")).then(s => setFree(!s.exists())).catch(() => setFree(false)); }, []);
  if (ready && !user) return <Navigate to="/login?next=/setup" />;
  const claim = async () => {
    if (!user) return; setBusy(true); setErr("");
    try {
      const b = writeBatch(db);
      b.set(doc(db, "config", "owner"), { uid: user.uid, at: Date.now() });
      b.update(doc(db, "users", user.uid), { role: "admin" });
      await b.commit();
      const b2 = writeBatch(db);
      SEED_PRODUCTS.forEach(({ id, ...p }) => b2.set(doc(collection(db, "products"), id), p));
      b2.set(doc(db, "settings", "main"), DEFAULT_SETTINGS);
      await b2.commit(); setDone(true);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <Page className="max-w-md mx-auto px-4 pt-20 text-center space-y-5">
      <h1 className="display text-4xl">{t("setupTitle")}</h1>
      {free === null && <div className="skeleton h-12" />}
      {free && !done && <><p className="text-slate-400">{t("setupDesc")}</p><button className="btn btn-primary" disabled={busy} onClick={claim}>{busy ? t("sending") : t("setupBtn")}</button></>}
      {(done || (free === false && role === "admin")) && <Link to="/admin/settings" className="btn btn-primary">{t("admin")} →</Link>}
      {free === false && role !== "admin" && !done && <p className="text-slate-400">{t("setupDone")}</p>}
      {err && <p className="text-rose-400 text-sm">{err}</p>}
    </Page>
  );
}

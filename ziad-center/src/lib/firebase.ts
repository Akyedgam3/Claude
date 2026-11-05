import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FB_API_KEY || "demo",
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID || "demo",
  appId: import.meta.env.VITE_FB_APP_ID,
});
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// كاش محلي = سرعة أعلى وتقليل القراءات (مهم للخطة المجانية)
export const db = initializeFirestore(app, { localCache: persistentLocalCache() });
export const WORKER_URL: string = import.meta.env.VITE_WORKER_URL || "";

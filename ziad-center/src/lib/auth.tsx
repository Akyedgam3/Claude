import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import { STAFF, type Role } from "./types";

interface A { user: User | null; role: Role; isStaff: boolean; ready: boolean;
  google(): Promise<void>; login(e: string, p: string): Promise<void>; register(n: string, e: string, p: string): Promise<void>; logout(): Promise<void> }
const Ctx = createContext<A>(null as never);

async function ensureProfile(u: User, name?: string): Promise<Role> {
  const ref = doc(db, "users", u.uid);
  const s = await getDoc(ref);
  if (s.exists()) return (s.data().role as Role) || "customer";
  await setDoc(ref, { name: name || u.displayName || "", email: u.email, role: "customer", createdAt: Date.now() });
  return "customer";
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("customer");
  const [ready, setReady] = useState(false);
  useEffect(() => onAuthStateChanged(auth, async u => {
    setUser(u);
    setRole(u ? await ensureProfile(u).catch(() => "customer" as Role) : "customer");
    setReady(true);
  }), []);
  const v: A = {
    user, role, ready, isStaff: STAFF.includes(role),
    google: async () => { await signInWithPopup(auth, googleProvider); },
    login: async (e, p) => { await signInWithEmailAndPassword(auth, e, p); },
    register: async (n, e, p) => { const c = await createUserWithEmailAndPassword(auth, e, p); await updateProfile(c.user, { displayName: n }); await ensureProfile(c.user, n); },
    logout: () => signOut(auth),
  };
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);

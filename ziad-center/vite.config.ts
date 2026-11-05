import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
export default defineConfig({ base: process.env.VITE_BASE || "/",
  plugins: [react(), tailwind()],
  build: { rollupOptions: { output: { manualChunks: { firebase: ["firebase/app", "firebase/auth", "firebase/firestore"], motion: ["framer-motion"] } } } } });

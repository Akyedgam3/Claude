import { StrictMode } from "react";
import { MotionConfig } from "framer-motion";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
// على GitHub Pages نستخدم روابط # لأن الاستضافة ما تدعم إعادة توجيه المسارات
const Router = import.meta.env.VITE_HASH ? HashRouter : BrowserRouter;
import "./index.css";
import App from "./App";
import { I18nProvider } from "./lib/i18n";
import { AuthProvider } from "./lib/auth";
import { DataProvider } from "./lib/data";
import { CartProvider } from "./lib/cart";

createRoot(document.getElementById("root")!).render(
  <StrictMode><Router><I18nProvider><AuthProvider><DataProvider><CartProvider><MotionConfig reducedMotion="user"><App /></MotionConfig></CartProvider></DataProvider></AuthProvider></I18nProvider></Router></StrictMode>
);

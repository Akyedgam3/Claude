import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Services from "./pages/Services";
import ProductPage from "./pages/ProductPage";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import OrderView from "./pages/OrderView";
import Setup from "./pages/Setup";
import { About, Contact, Offers, Tips } from "./pages/Info";
import Shipping from "./pages/Shipping";
// لوحة الإدارة تُحمَّل عند الحاجة فقط = الموقع العام أسرع
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));

export default function App() {
  const loc = useLocation();
  return (
    <Suspense fallback={<div className="p-10"><div className="skeleton h-40" /></div>}>
      <AnimatePresence mode="wait">
        <Routes location={loc} key={loc.pathname.startsWith("/admin") ? "admin" : loc.pathname}>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="services/:id" element={<ProductPage />} />
            <Route path="cart" element={<Cart />} />
            <Route path="setup" element={<Setup />} />
            <Route path="login" element={<Login />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderView />} />
            <Route path="offers" element={<Offers />} />
            <Route path="tips" element={<Tips />} />
            <Route path="shipping" element={<Shipping />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
          </Route>
          <Route path="admin/*" element={<AdminLayout />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

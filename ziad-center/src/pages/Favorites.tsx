import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { useExtras } from "../lib/extras";
import { Page } from "../components/Page";
import ProductCard from "../components/ProductCard";

export default function Favorites() {
  const { lang } = useI18n(); const { products } = useData(); const { favs } = useExtras();
  const tr = (a: string, e: string) => (lang === "ar" ? a : e);
  const list = favs.map(id => products.find(p => p.id === id)).filter(Boolean) as typeof products;
  return (
    <Page className="max-w-6xl mx-auto px-4 pt-14">
      <h1 className="display text-4xl md:text-5xl text-ink">{tr("المفضلة", "Favourites")}</h1>
      {list.length === 0 ? (
        <div className="card p-10 text-center mt-10">
          <p className="text-slate-700">{tr("لم تضف أي منتج للمفضلة بعد. اضغط على القلب في أي منتج لحفظه هنا.", "No favourites yet. Tap the heart on any product to save it here.")}</p>
          <Link to="/services" className="btn btn-primary mt-6">{tr("تصفّح المنتجات", "Browse products")}</Link>
        </div>
      ) : <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{list.map(p => <ProductCard key={p.id} p={p} />)}</div>}
    </Page>
  );
}

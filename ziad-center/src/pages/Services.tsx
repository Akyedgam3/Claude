import { useI18n } from "../lib/i18n";
import { useData } from "../lib/data";
import { Page, Reveal } from "../components/Page";
import ProductCard from "../components/ProductCard";
export default function Services() {
  const { t } = useI18n(); const { products } = useData();
  return (
    <Page className="max-w-6xl mx-auto px-4 pt-10">
      <h1 className="text-4xl font-extrabold mb-8 grad-text">{t("services")}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {products.map((p, i) => <Reveal key={p.id} delay={(i % 4) * .05}><ProductCard p={p} /></Reveal>)}
      </div>
    </Page>
  );
}

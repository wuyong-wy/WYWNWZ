import type { Product } from "@/lib/saleor";
import { ProductCard } from "./ProductCard";
import { useTranslations } from "next-intl";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const t = useTranslations("product");

  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-[var(--color-muted)]">
        {t("noProducts")}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

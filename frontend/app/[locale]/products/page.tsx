import { setRequestLocale } from "next-intl/server";
import { getProducts } from "@/lib/saleor";
import { useTranslations } from "next-intl";
import { ProductGrid } from "@/components/product/ProductGrid";

type Props = { params: Promise<{ locale: string }> };

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await getProducts({ first: 20 }).catch(() => ({
    products: [],
    hasNextPage: false,
    endCursor: null,
    totalCount: 0,
  }));

  return <ProductsContent products={data.products} totalCount={data.totalCount} />;
}

function ProductsContent({ products, totalCount }: { products: Parameters<typeof ProductGrid>[0]["products"]; totalCount: number }) {
  const t = useTranslations("nav");
  const pt = useTranslations("product");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">{t("products")}</h1>
      <p className="mb-8 text-sm text-[var(--color-muted)]">
        {totalCount} {pt("noProducts").replace("No products found", "products")}
      </p>
      <ProductGrid products={products} />
    </div>
  );
}

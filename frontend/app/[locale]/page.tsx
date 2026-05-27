import { setRequestLocale } from "next-intl/server";
import { getProducts, getCategories, tCategory } from "@/lib/saleor";
import { useTranslations } from "next-intl";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SchemaMarkup, organizationSchema } from "@/components/shared/SchemaMarkup";
import Link from "next/link";
import type { Category } from "@/lib/saleor";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [productsData, categories] = await Promise.all([
    getProducts({ first: 8, locale }).catch(() => ({ products: [], hasNextPage: false, endCursor: null, totalCount: 0 })),
    getCategories({ first: 10, locale }).catch(() => []),
  ]);

  return (
    <>
      <SchemaMarkup schema={organizationSchema(SITE_NAME, SITE_URL)} />
      <HomeContent locale={locale} products={productsData.products} categories={categories} />
    </>
  );
}

function HomeContent({ locale, products, categories }: { locale: string; products: Parameters<typeof ProductGrid>[0]["products"]; categories: Category[] }) {
  const t = useTranslations("home");
  const common = useTranslations("common");

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
            {t("heroSubtitle")}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href={`/${locale}/products`}
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
            >
              {common("viewAll")}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="rounded-md border border-white px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {common("contactUs")}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-8 text-2xl font-bold">{t("featuredProducts")}</h2>
            <ProductGrid products={products} />
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-8 text-2xl font-bold">{t("categories")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${locale}/categories/${cat.slug}`}
                  className="group rounded-lg border bg-white p-6 transition-shadow hover:shadow-lg"
                >
                  <h3 className="font-semibold group-hover:text-[var(--color-primary)]">{tCategory(cat, "name") || cat.name}</h3>
                  {(tCategory(cat, "description") || cat.description) && (
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">{tCategory(cat, "description") || cat.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

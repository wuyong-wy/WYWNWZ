import { setRequestLocale } from "next-intl/server";
import { getCategoryBySlug, tCategory } from "@/lib/saleor";
import { notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SchemaMarkup, breadcrumbSchema } from "@/components/shared/SchemaMarkup";
import Link from "next/link";
import type { Product } from "@/lib/saleor";
import { SITE_URL } from "@/lib/constants";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 300; // ISR: 5 分钟重新验证

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const category = await getCategoryBySlug(slug, { locale });
  if (!category) return { title: "Category Not Found" };

  const name = tCategory(category, "name") || category.name;
  const seoTitle = tCategory(category, "seoTitle") || name;
  const seoDescription = tCategory(category, "seoDescription") || category.description?.slice(0, 160);

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: `${SITE_URL}/${locale}/categories/${slug}`,
      languages: {
        en: `${SITE_URL}/en/categories/${slug}`,
        zh: `${SITE_URL}/zh/categories/${slug}`,
      },
    },
  };
}

export default async function CategoryDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const category = await getCategoryBySlug(slug, { locale });
  if (!category) notFound();

  const products: Product[] = category.products?.edges?.map((e: { node: Product }) => e.node) || [];

  return (
    <>
      <SchemaMarkup
        schema={breadcrumbSchema([
          { name: "Home", url: SITE_URL },
          { name: "Categories", url: `${SITE_URL}/categories` },
          { name: tCategory(category, "name") || category.name, url: `${SITE_URL}/categories/${slug}` },
        ])}
      />
      <CategoryContent
        category={category}
        products={products}
        locale={locale}
      />
    </>
  );
}

function CategoryContent({
  category,
  products,
  locale,
}: {
  category: NonNullable<Awaited<ReturnType<typeof getCategoryBySlug>>>;
  products: Product[];
  locale: string;
}) {
  const t = useTranslations("nav");
  const name = tCategory(category, "name") || category.name;
  const description = tCategory(category, "description") || category.description;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-[var(--color-muted)]">
        <Link href={`/${locale}`} className="hover:text-[var(--color-primary)]">{t("home")}</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-foreground)]">{name}</span>
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{name}</h1>
        {description && (
          <p className="text-[var(--color-muted)]">{description}</p>
        )}
      </div>

      {/* Products Grid */}
      <ProductGrid products={products} />
    </div>
  );
}

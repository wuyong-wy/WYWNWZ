import { setRequestLocale } from "next-intl/server";
import { getProductBySlug, t } from "@/lib/saleor";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { ProductGallery } from "@/components/product/ProductGallery";
import { InquiryForm } from "@/components/inquiry/InquiryForm";
import { SchemaMarkup, productSchema, breadcrumbSchema } from "@/components/shared/SchemaMarkup";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import DOMPurify from "dompurify";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 60; // ISR: 60 秒重新验证

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug, { locale });
  if (!product) return { title: "Product Not Found" };

  const name = t(product, "name") || product.name;
  const seoTitle = t(product, "seoTitle") || name;
  const seoDescription = t(product, "seoDescription") || product.description?.slice(0, 160);

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: `${SITE_URL}/${locale}/products/${slug}`,
      languages: {
        en: `${SITE_URL}/en/products/${slug}`,
        zh: `${SITE_URL}/zh/products/${slug}`,
      },
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription || undefined,
      images: product.thumbnail?.url ? [{ url: product.thumbnail.url, alt: product.thumbnail.alt || name }] : undefined,
      type: "website",
      locale: locale,
      alternateLocale: locale === "en" ? "zh" : "en",
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = await getProductBySlug(slug, { locale });
  if (!product) notFound();

  const displayName = t(product, "name") || product.name;
  const displayDescription = t(product, "description") || product.description;

  return (
    <>
      <SchemaMarkup
        schema={[
          productSchema({
            name: displayName,
            description: displayDescription || "",
            slug: product.slug,
            imageUrl: product.thumbnail?.url,
            imageAlt: product.thumbnail?.alt || undefined,
            siteUrl: SITE_URL,
          }),
          breadcrumbSchema([
            { name: "Home", url: SITE_URL },
            { name: "Products", url: `${SITE_URL}/products` },
            { name: displayName, url: `${SITE_URL}/products/${product.slug}` },
          ]),
        ]}
      />
      <ProductDetailContent product={product} locale={locale} displayName={displayName} displayDescription={displayDescription} />
    </>
  );
}

function ProductDetailContent({ product, locale, displayName, displayDescription }: {
  product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
  locale: string;
  displayName: string;
  displayDescription: string | null;
}) {
  const pt = useTranslations("product");
  const nav = useTranslations("nav");

  const images = product.media?.map((m) => ({ url: m.url, alt: m.alt, type: m.type })) || [];
  if (product.thumbnail && images.length === 0) {
    images.push({ url: product.thumbnail.url, alt: product.thumbnail.alt || displayName, type: "IMAGE" });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-[var(--color-muted)]">
        <Link href={`/${locale}`} className="hover:text-[var(--color-primary)]">{nav("home")}</Link>
        <span className="mx-2">/</span>
        <Link href={`/${locale}/products`} className="hover:text-[var(--color-primary)]">{nav("products")}</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-foreground)]">{displayName}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Gallery */}
        <ProductGallery images={images} productName={displayName} />

        {/* Product Info */}
        <div>
          {product.category && (
            <span className="mb-2 inline-block text-sm font-medium text-[var(--color-primary)]">
              {product.category.translation?.name || product.category.name}
            </span>
          )}
          <h1 className="mb-4 text-3xl font-bold">{displayName}</h1>

          {/* Description */}
          {displayDescription && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold">{pt("description")}</h2>
              <div
                className="prose prose-sm max-w-none text-[var(--color-muted)]"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayDescription) }}
              />
            </div>
          )}

          {/* Attributes / Specifications */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{pt("specifications")}</h2>
              <dl className="grid gap-2">
                {product.attributes.map((attr, i) => (
                  <div key={i} className="flex border-b py-2 text-sm">
                    <dt className="w-1/3 font-medium text-[var(--color-muted)]">
                      {attr.attribute.translation?.name || attr.attribute.name}
                    </dt>
                    <dd className="w-2/3">
                      {attr.values.map((v) => v.translation?.name || v.name).join(", ")}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Inquiry Form */}
          <div className="mt-8 rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">{pt("inquiryAbout")}</h2>
            <InquiryForm
              productId={product.id}
              productName={displayName}
              sourceUrl={`${SITE_URL}/${locale}/products/${product.slug}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

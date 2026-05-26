import { setRequestLocale } from "next-intl/server";
import { getProductBySlug } from "@/lib/saleor";
import { notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ProductGallery } from "@/components/product/ProductGallery";
import { InquiryForm } from "@/components/inquiry/InquiryForm";
import { SchemaMarkup, productSchema, breadcrumbSchema } from "@/components/shared/SchemaMarkup";
import Link from "next/link";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 60; // ISR: 60 秒重新验证

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.description?.slice(0, 160),
    alternates: {
      canonical: `https://yourdomain.com/${locale}/products/${slug}`,
      languages: {
        en: `https://yourdomain.com/en/products/${slug}`,
        zh: `https://yourdomain.com/zh/products/${slug}`,
      },
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <SchemaMarkup
        schema={[
          productSchema({
            name: product.name,
            description: product.description || "",
            slug: product.slug,
            imageUrl: product.thumbnail?.url,
            imageAlt: product.thumbnail?.alt || undefined,
            siteUrl: "https://yourdomain.com",
          }),
          breadcrumbSchema([
            { name: "Home", url: "https://yourdomain.com" },
            { name: "Products", url: "https://yourdomain.com/products" },
            { name: product.name, url: `https://yourdomain.com/products/${product.slug}` },
          ]),
        ]}
      />
      <ProductDetailContent product={product} locale={locale} />
    </>
  );
}

function ProductDetailContent({ product, locale }: { product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>>; locale: string }) {
  const t = useTranslations("product");
  const nav = useTranslations("nav");

  const images = product.media?.map((m) => ({ url: m.url, alt: m.alt, type: m.type })) || [];
  if (product.thumbnail && images.length === 0) {
    images.push({ url: product.thumbnail.url, alt: product.thumbnail.alt || product.name, type: "IMAGE" });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-[var(--color-muted)]">
        <Link href={`/${locale}`} className="hover:text-[var(--color-primary)]">{nav("home")}</Link>
        <span className="mx-2">/</span>
        <Link href={`/${locale}/products`} className="hover:text-[var(--color-primary)]">{nav("products")}</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-foreground)]">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Gallery */}
        <ProductGallery images={images} productName={product.name} />

        {/* Product Info */}
        <div>
          {product.category && (
            <span className="mb-2 inline-block text-sm font-medium text-[var(--color-primary)]">
              {product.category.name}
            </span>
          )}
          <h1 className="mb-4 text-3xl font-bold">{product.name}</h1>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold">{t("description")}</h2>
              <div
                className="prose prose-sm max-w-none text-[var(--color-muted)]"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* Attributes / Specifications */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">{t("specifications")}</h2>
              <dl className="grid gap-2">
                {product.attributes.map((attr, i) => (
                  <div key={i} className="flex border-b py-2 text-sm">
                    <dt className="w-1/3 font-medium text-[var(--color-muted)]">
                      {attr.attribute.name}
                    </dt>
                    <dd className="w-2/3">
                      {attr.values.map((v) => v.name).join(", ")}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Inquiry Form */}
          <div className="mt-8 rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("inquiryAbout")}</h2>
            <InquiryForm
              productId={product.id}
              productName={product.name}
              sourceUrl={`https://yourdomain.com/${locale}/products/${product.slug}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

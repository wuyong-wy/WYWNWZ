/**
 * JSON-LD Schema 结构化数据组件
 */

interface SchemaMarkupProps {
  schema: Record<string, unknown> | Record<string, unknown>[];
}

export function SchemaMarkup({ schema }: SchemaMarkupProps) {
  const schemas = Array.isArray(schema) ? schema : [schema];

  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  );
}

/** Organization Schema */
export function organizationSchema(siteName: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url,
    logo: `${url}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      availableLanguage: ["English", "Chinese"],
    },
  };
}

/** Product Schema */
export function productSchema(product: {
  name: string;
  description: string;
  slug: string;
  imageUrl?: string;
  imageAlt?: string;
  siteUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url: `${product.siteUrl}/products/${product.slug}`,
    ...(product.imageUrl && {
      image: {
        "@type": "ImageObject",
        url: product.imageUrl,
        alt: product.imageAlt || product.name,
      },
    }),
  };
}

/** BreadcrumbList Schema */
export function breadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { Product } from "@/lib/saleor";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="group block overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-lg"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.thumbnail?.url ? (
          <Image
            src={product.thumbnail.url}
            alt={product.thumbnail.alt || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 10l8 4m0-10v10" />
            </svg>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {product.category && (
          <span className="mb-1 block text-xs font-medium uppercase text-[var(--color-primary)]">
            {product.category.name}
          </span>
        )}
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)]">
          {product.name}
        </h3>
        <span className="inline-block rounded-md bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-white transition-colors group-hover:bg-[var(--color-primary-hover)]">
          {t("inquiryNow")}
        </span>
      </div>
    </Link>
  );
}

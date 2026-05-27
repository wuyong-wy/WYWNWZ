"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface ProductGalleryProps {
  images: { url: string; alt: string | null; type: string }[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const t = useTranslations("product");
  const displayImages = images.length > 0 ? images : [];

  if (displayImages.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100">
        <span className="text-gray-400">{t("noImages")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={displayImages[activeIndex].url}
          alt={displayImages[activeIndex].alt || productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                idx === activeIndex
                  ? "border-[var(--color-primary)]"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt || `${productName} ${idx + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

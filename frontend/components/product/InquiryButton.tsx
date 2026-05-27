"use client";

import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";

interface InquiryButtonProps {
  productName?: string;
  productId?: string;
  onClick?: () => void;
}

export function InquiryButton({ productName, onClick }: InquiryButtonProps) {
  const t = useTranslations("product");

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
    >
      <MessageSquare className="h-4 w-4" />
      {t("inquiryAbout")}
    </button>
  );
}

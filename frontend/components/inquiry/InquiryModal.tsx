"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { InquiryForm } from "./InquiryForm";

interface InquiryModalProps {
  productId?: string;
  productName?: string;
  open: boolean;
  onClose: () => void;
}

export function InquiryModal({ productId, productName, open, onClose }: InquiryModalProps) {
  const t = useTranslations("inquiry");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t("title")}</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{t("subtitle")}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <InquiryForm productId={productId} productName={productName} />
      </div>
    </div>
  );
}

/** 便捷 Hook：打开/关闭询盘模态框 */
export function useInquiryModal() {
  const [open, setOpen] = useState(false);
  return {
    open,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
  };
}

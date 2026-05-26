"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitInquiry, type InquiryPayload } from "@/lib/api";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface InquiryFormProps {
  productId?: string;
  productName?: string;
  sourceUrl?: string;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

export function InquiryForm({ productId, productName, sourceUrl }: InquiryFormProps) {
  const t = useTranslations("inquiry");
  const locale = useLocale();
  const [status, setStatus] = useState<FormStatus>("idle");

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_company: "",
    customer_phone: "",
    quantity: "",
    delivery_deadline: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.customer_name.trim()) newErrors.customer_name = t("nameRequired");
    if (!form.customer_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email))
      newErrors.customer_email = t("emailRequired");
    if (!form.message.trim()) newErrors.message = t("messageRequired");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");

    const payload: InquiryPayload = {
      ...form,
      saleor_product_id: productId,
      product_name: productName,
      language: locale,
      source_url: sourceUrl,
    };

    try {
      await submitInquiry(payload);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <p className="text-sm text-green-700">{t("success")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === "error" && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {t("error")}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("name")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          {errors.customer_name && <p className="mt-1 text-xs text-red-500">{errors.customer_name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("email")} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={form.customer_email}
            onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          {errors.customer_email && <p className="mt-1 text-xs text-red-500">{errors.customer_email}</p>}
        </div>

        {/* Company */}
        <div>
          <label className="mb-1 block text-sm font-medium">{t("company")}</label>
          <input
            type="text"
            value={form.customer_company}
            onChange={(e) => setForm({ ...form, customer_company: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1 block text-sm font-medium">{t("phone")}</label>
          <input
            type="tel"
            value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="mb-1 block text-sm font-medium">{t("quantity")}</label>
          <input
            type="text"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="e.g. 1000-5000 pcs"
            className="w-full rounded-md border px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="mb-1 block text-sm font-medium">{t("deadline")}</label>
          <input
            type="text"
            value={form.delivery_deadline}
            onChange={(e) => setForm({ ...form, delivery_deadline: e.target.value })}
            placeholder="e.g. 30 days"
            className="w-full rounded-md border px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("message")} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder={t("messagePlaceholder")}
          rows={4}
          className="w-full rounded-md border px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
        {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50 sm:w-auto"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("submitting")}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {t("submit")}
          </>
        )}
      </button>
    </form>
  );
}

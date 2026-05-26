"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Cookie, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "cookie_consent";

export function CookieConsent() {
  const t = useTranslations("cookie");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function acceptAll() {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ necessary: true, analytics: true, marketing: true }));
    setVisible(false);
    // 启用 GA4 和 Clarity
    if (typeof window !== "undefined" && (window as Record<string, unknown>).gtag) {
      ((window as Record<string, unknown>).gtag as Function)("consent", "update", { analytics_storage: "granted", ad_storage: "granted" });
    }
  }

  function rejectNonEssential() {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ necessary: true, analytics: false, marketing: false }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-muted)]">{t("description")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={rejectNonEssential}
            className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
          >
            {t("reject")}
          </button>
          <button
            onClick={acceptAll}
            className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}

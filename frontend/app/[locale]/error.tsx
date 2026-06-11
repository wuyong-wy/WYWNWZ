"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-semibold text-[var(--color-foreground)]">
          {t("errorTitle")}
        </h2>
        <p className="mb-6 text-sm text-[var(--color-muted)]">
          {t("errorDescription")}
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          {t("tryAgain")}
        </button>
      </div>
    </div>
  );
}

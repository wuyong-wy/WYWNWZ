import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function NotFound() {
  const locale = useLocale();
  const common = useTranslations("common");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-6xl font-bold text-[var(--color-primary)]">404</h1>
      <p className="mb-6 text-lg text-[var(--color-muted)]">
        {locale === "zh" ? "页面未找到" : "Page not found"}
      </p>
      <Link
        href={`/${locale}`}
        className="rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
      >
        {common("back")}
      </Link>
    </div>
  );
}

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const common = useTranslations("common");
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Company Info */}
          <div>
            <h3 className="mb-3 text-lg font-bold text-[var(--color-primary)]">
              {common("siteName")}
            </h3>
            <p className="text-sm text-[var(--color-muted)]">{t("companyDesc")}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-3 font-semibold">{t("quickLinks")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}/products`} className="text-[var(--color-muted)] hover:text-[var(--color-primary)]">
                  {nav("products")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="text-[var(--color-muted)] hover:text-[var(--color-primary)]">
                  {nav("about")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="text-[var(--color-muted)] hover:text-[var(--color-primary)]">
                  {nav("contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="mb-3 font-semibold">{t("contactInfo")}</h4>
            <ul className="space-y-2 text-sm text-[var(--color-muted)]">
              <li>info@yourdomain.com</li>
              <li>+86 138-0013-8000</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-[var(--color-muted)]">
          &copy; {year} {common("siteName")}. {t("copyright")}
        </div>
      </div>
    </footer>
  );
}

import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { InquiryForm } from "@/components/inquiry/InquiryForm";
import Link from "next/link";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/constants";

type Props = { params: Promise<{ locale: string }> };

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactContent locale={locale} />;
}

function ContactContent({ locale }: { locale: string }) {
  const t = useTranslations("contact");
  const nav = useTranslations("nav");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <nav className="mb-6 text-sm text-[var(--color-muted)]">
        <Link href={`/${locale}`} className="hover:text-[var(--color-primary)]">{nav("home")}</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-foreground)]">{t("title")}</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contact Info */}
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-semibold">{t("email")}</h3>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-primary)] hover:underline">
              {CONTACT_EMAIL}
            </a>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">{t("phone")}</h3>
            <a href={`tel:${CONTACT_PHONE.replace(/[^0-9+]/g, "")}`} className="text-[var(--color-primary)] hover:underline">
              {CONTACT_PHONE}
            </a>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">{t("whatsapp")}</h3>
            <a
              href={`https://wa.me/${CONTACT_PHONE.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-primary)] hover:underline"
            >
              {CONTACT_PHONE}
            </a>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">{t("address")}</h3>
            <p className="text-[var(--color-muted)]">
              Industrial Zone, City, Province, China
            </p>
          </div>
        </div>

        {/* Inquiry Form */}
        <div className="rounded-lg border p-6">
          <InquiryForm />
        </div>
      </div>
    </div>
  );
}

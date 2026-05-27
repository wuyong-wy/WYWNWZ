import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AboutContent locale={locale} />;
}

function AboutContent({ locale }: { locale: string }) {
  const t = useTranslations("about");
  const nav = useTranslations("nav");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <nav className="mb-6 text-sm text-[var(--color-muted)]">
        <Link href={`/${locale}`} className="hover:text-[var(--color-primary)]">{nav("home")}</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-foreground)]">{t("title")}</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>

      <div className="prose prose-lg max-w-none">
        <h2>{t("companyIntro")}</h2>
        <p>{t("companyIntroDesc")}</p>

        <h2>{t("certifications")}</h2>
        <ul>
          <li>{t("certIso9001")}</li>
          <li>{t("certIso14001")}</li>
          <li>{t("certCe")}</li>
          <li>{t("certRohs")}</li>
        </ul>

        <h2>{t("factory")}</h2>
        <p>{t("factoryDesc")}</p>
      </div>
    </div>
  );
}

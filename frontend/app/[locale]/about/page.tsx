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
        <p>
          We are a professional manufacturing and trading company with over 10 years of experience
          in providing high-quality products to global markets. Our commitment to quality, innovation,
          and customer satisfaction has made us a trusted partner for businesses worldwide.
        </p>

        <h2>{t("certifications")}</h2>
        <ul>
          <li>ISO 9001:2015 Quality Management System</li>
          <li>ISO 14001:2015 Environmental Management System</li>
          <li>CE Certification</li>
          <li>RoHS Compliance</li>
        </ul>

        <h2>{t("factory")}</h2>
        <p>
          Our state-of-the-art manufacturing facility spans over 20,000 square meters,
          equipped with advanced production lines and quality control systems.
          We employ over 200 skilled workers and maintain strict quality standards
          throughout the production process.
        </p>
      </div>
    </div>
  );
}

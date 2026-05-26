import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

type Props = { params: Promise<{ locale: string }> };

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyContent />;
}

function PrivacyContent() {
  const t = useTranslations("privacy");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">{t("title")}</h1>
      <p className="mb-8 text-sm text-[var(--color-muted)]">
        {t("lastUpdated")}: 2026-05-26
      </p>

      <div className="prose prose-sm max-w-none">
        <h2>1. Information We Collect</h2>
        <p>
          When you submit an inquiry through our website, we collect the following information:
        </p>
        <ul>
          <li>Your name and email address (required)</li>
          <li>Company name, phone number (optional)</li>
          <li>Product inquiry details and message content</li>
          <li>Language preference and source page URL</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information you provide to:</p>
        <ul>
          <li>Respond to your product inquiries</li>
          <li>Send you quotations and product information</li>
          <li>Improve our website and services</li>
        </ul>

        <h2>3. Data Storage and Security</h2>
        <p>
          Your data is stored on secure servers with encryption. We retain inquiry data
          for up to 2 years, after which it is automatically archived.
        </p>

        <h2>4. Your Rights (GDPR)</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Request access to your personal data</li>
          <li>Request deletion of your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Object to processing of your data</li>
          <li>Request data portability</li>
        </ul>
        <p>
          To exercise these rights, please contact us at{" "}
          <a href="mailto:privacy@yourdomain.com" className="text-[var(--color-primary)] hover:underline">
            privacy@yourdomain.com
          </a>
        </p>

        <h2>5. Cookies</h2>
        <p>
          We use cookies for website functionality, analytics, and marketing purposes.
          You can manage your cookie preferences using the cookie consent banner.
        </p>

        <h2>6. Contact</h2>
        <p>
          For privacy-related inquiries, contact our Data Protection Officer at{" "}
          <a href="mailto:privacy@yourdomain.com" className="text-[var(--color-primary)] hover:underline">
            privacy@yourdomain.com
          </a>
        </p>
      </div>
    </div>
  );
}

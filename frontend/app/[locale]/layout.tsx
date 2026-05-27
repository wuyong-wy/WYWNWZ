import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloat } from "@/components/shared/WhatsAppFloat";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import "@/app/globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: {
      default: `${SITE_NAME} - Professional Manufacturing Solutions`,
      template: `%s | ${SITE_NAME}`,
    },
    description: "Professional manufacturing and trading company. Quality products, competitive pricing, global delivery.",
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        en: `${SITE_URL}/en`,
        zh: `${SITE_URL}/zh`,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "zh")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} dir="ltr">
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <ErrorBoundary>
            <main className="min-h-[calc(100vh-8rem)]">{children}</main>
          </ErrorBoundary>
          <Footer />
          <WhatsAppFloat />
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

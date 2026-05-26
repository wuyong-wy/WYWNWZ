import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloat } from "@/components/shared/WhatsAppFloat";
import { CookieConsent } from "@/components/shared/CookieConsent";
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
      default: "Foreign Trade - Professional Manufacturing Solutions",
      template: "%s | Foreign Trade",
    },
    description: "Professional manufacturing and trading company. Quality products, competitive pricing, global delivery.",
    alternates: {
      canonical: `https://yourdomain.com/${locale}`,
      languages: {
        en: "https://yourdomain.com/en",
        zh: "https://yourdomain.com/zh",
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
          <main className="min-h-[calc(100vh-8rem)]">{children}</main>
          <Footer />
          <WhatsAppFloat />
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FlowProvider } from "@/hooks/useMatchFlow";
import "../globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// Display face: Plus Jakarta Sans was drawn in Jakarta, which fits an Indonesian-first product.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  const name = t("title");
  const description = t("description");
  // Share images are rendered by brand/render.mjs from the same messages.
  const ogImage = { url: `/og/og-${locale}.png`, width: 1200, height: 630, alt: t("ogAlt") };
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: name, template: `%s · ${name}` },
    description,
    applicationName: name,
    alternates: { canonical: `/${locale}`, languages: { id: "/id", en: "/en" } },
    openGraph: {
      type: "website",
      siteName: name,
      title: name,
      description,
      locale: locale === "id" ? "id_ID" : "en_US",
      images: [ogImage],
    },
    twitter: { card: "summary_large_image", title: name, description, images: [ogImage] },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111a2e" },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Common");

  return (
    <html lang={locale} className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col antialiased">
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
          >
            {t("skipToContent")}
          </a>
          <FlowProvider>
            <Header />
            <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
              {children}
            </main>
            <Footer />
          </FlowProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

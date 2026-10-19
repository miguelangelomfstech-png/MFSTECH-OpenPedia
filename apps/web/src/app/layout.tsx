import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { themeScript } from "@/lib/theme";
import { getLocale, getT } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif-4", display: "swap" });

const siteName = process.env.SITE_NAME ?? "MFSTECH-OpenPedia";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: { default: `${siteName} — the free, open encyclopedia`, template: `%s — ${siteName}` },
  description: "A free, open, collaborative encyclopedia that anyone can read and edit.",
  icons: { icon: "/mfstech_logo.jpg", apple: "/mfstech_logo.jpg" },
  openGraph: { siteName, type: "website" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, t] = [await getLocale(), await getT()];
  return (
    <html lang={locale} className={`${inter.variable} ${serif.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-screen antialiased">
        <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-accent focus:p-3 focus:text-accent-ink">{t("skip")}</a>
        <Header />
        <main id="content" className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-line py-8 text-center text-sm text-muted">
          <p>{siteName} — content is available under <a className="underline" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> unless noted.</p>
          <p className="mt-1"><a className="underline" href="/api/graphql">GraphQL</a> · <a className="underline" href="/api/v1/articles">REST API</a> · <a className="underline" href="/sitemap.xml">Sitemap</a></p>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { headers } from "next/headers";
import { Header } from "@/components/Header";
import { AppShell } from "@/components/AppShell";
import { GdprConsent } from "@/components/GdprConsent";
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
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const initialIsSocial = pathname.startsWith("/social");

  return (
    <html lang={locale} className={`${inter.variable} ${serif.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-screen antialiased flex flex-col justify-between">
        <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-accent focus:p-3 focus:text-accent-ink">{t("skip")}</a>
        <AppShell
          initialIsSocial={initialIsSocial}
          header={<Header />}
          footer={
            <footer className="mt-16 border-t border-line py-8 text-center text-sm text-muted">
              <p>{siteName} — content is available under <a className="underline" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> unless noted.</p>
              <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <Link className="underline hover:text-ink" href="/privacy">{t("privacy")}</Link>
                <span>·</span>
                <Link className="underline hover:text-ink" href="/api/graphql">GraphQL</Link>
                <span>·</span>
                <Link className="underline hover:text-ink" href="/api/v1/articles">REST API</Link>
                <span>·</span>
                <Link className="underline hover:text-ink" href="/sitemap.xml">Sitemap</Link>
              </p>
            </footer>
          }
        >
          {children}
        </AppShell>
        <GdprConsent currentLocale={locale} />
      </body>
    </html>
  );
}

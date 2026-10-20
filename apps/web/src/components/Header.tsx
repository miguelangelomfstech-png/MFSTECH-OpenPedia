import Link from "next/link";
import { db, notifications, eq, and, count } from "@wiki/db";
import { getViewer } from "@/lib/viewer";
import { getT, getLocale } from "@/lib/i18n";
import { logout } from "@/app/actions";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";

export async function Header() {
  const [t, locale] = [await getT(), await getLocale()];
  const { user } = await getViewer();
  let unread = 0;
  if (user) {
    const [r] = await db.select({ n: count() }).from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
    unread = r?.n ?? 0;
  }
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <img
            src="/mfstech_logo.jpg"
            alt="MFSTECH-OpenPedia logo"
            className="h-8 w-8 rounded-lg object-cover border border-line shadow-xs"
          />
          <span className="font-sans text-xl font-bold tracking-tight">
            <span className="text-accent">MFSTECH</span>
            <span className="text-muted font-normal mx-0.5">-</span>
            <span className="font-serif">OpenPedia</span>
          </span>
        </Link>
        <div className="order-3 w-full md:order-none md:flex-1 md:px-6"><SearchBox placeholder={t("searchPlaceholder")} label={t("search")} /></div>
        <nav aria-label="Main" className="ml-auto flex items-center gap-2 text-sm">
          <Link className="btn hidden sm:inline-flex" href="/recent">{t("recent")}</Link>
          <Link className="btn hidden sm:inline-flex" href="/upload">{t("upload")}</Link>
          {user ? (
            <>
              <Link className="btn" href="/watchlist">
                {t("watchlist")}{unread > 0 && <span className="rounded-full bg-accent px-2 text-xs text-accent-ink" aria-label={`${unread} unread`}>{unread}</span>}
              </Link>
              <Link className="btn" href={`/user/${encodeURIComponent(user.name)}`}>{user.name}</Link>
              <form action={logout}><button className="btn">{t("logout")}</button></form>
            </>
          ) : (
            <>
              <Link className="btn" href="/login">{t("login")}</Link>
              <Link className="btn btn-primary" href="/register">{t("register")}</Link>
            </>
          )}
          <LanguageSelector currentLocale={locale} />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";
import { db, notifications, eq, and, count } from "@wiki/db";
import { getViewer } from "@/lib/viewer";
import { getT, getLocale } from "@/lib/i18n";
import { logout } from "@/app/actions";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";
import { AiResearchModal } from "./AiResearchModal";
import { HeaderMobileDrawer } from "./HeaderMobileDrawer";

export async function Header() {
  const [t, locale] = [await getT(), await getLocale()];
  const { user } = await getViewer();
  let unread = 0;
  if (user) {
    const [r] = await db.select({ n: count() }).from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
    unread = r?.n ?? 0;
  }

  const drawerLabels = {
    startWriting: t("startWriting"),
    recent: t("recent"),
    upload: t("upload"),
    watchlist: t("watchlist"),
    login: t("login"),
    register: t("register"),
    logout: t("logout"),
    social: "MFSTECH SOCIAL",
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2.5 px-3 py-2.5 sm:px-4 sm:py-3 md:gap-4">
        {/* Logotipo e Identidade Visual (Adaptado para computador e telemóvel) */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0">
          <img
            src="/mfstech_logo.jpg"
            alt="MFSTECH-OpenPedia logo"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-cover border border-line shadow-xs"
          />
          <span className="font-sans text-base sm:text-xl font-bold tracking-tight">
            <span className="text-accent">MFSTECH</span>
            <span className="text-muted font-normal mx-0.5">-</span>
            <span className="font-serif">OpenPedia</span>
          </span>
        </Link>

        {/* Caixa de Pesquisa: No computador fica integrada no centro; no telemóvel posiciona-se em largura total */}
        <div className="order-3 w-full md:order-none md:flex-1 md:max-w-md md:px-2">
          <SearchBox placeholder={t("searchPlaceholder")} label={t("search")} />
        </div>

        {/* Ações e Navegação */}
        <nav aria-label="Main" className="ml-auto flex items-center gap-1.5 sm:gap-2 text-sm">
          {/* Começar a Escrever */}
          <Link
            id="header-start-writing-btn"
            href="/wiki/new/edit"
            className="btn btn-primary inline-flex items-center gap-1.5 font-semibold text-xs sm:text-sm !py-1 !px-2.5 sm:!py-1.5 sm:!px-3.5 shadow-xs"
            title={t("startWriting")}
          >
            <span aria-hidden="true" className="text-sm">✍️</span>
            <span className="hidden sm:inline">{t("startWriting")}</span>
          </Link>

          {/* MFSTECH SOCIAL */}
          <Link
            id="header-social-btn"
            href="/social"
            className="btn inline-flex items-center gap-1.5 font-semibold text-xs sm:text-sm !py-1 !px-2.5 sm:!py-1.5 sm:!px-3 text-blue-500 border border-blue-500/30 hover:bg-blue-500/10 shadow-2xs"
            title="MFSTECH SOCIAL"
          >
            <span aria-hidden="true" className="text-sm">🌐</span>
            <span className="hidden lg:inline">MFSTECH SOCIAL</span>
          </Link>

          {/* Assistente de Pesquisa com IA */}
          <div className="hidden sm:inline-flex">
            <AiResearchModal currentLocale={locale} />
          </div>

          {/* Links Secundários Visíveis em Computadores e Tablets */}
          <Link className="btn hidden md:inline-flex text-xs sm:text-sm" href="/recent">{t("recent")}</Link>
          <Link className="btn hidden md:inline-flex text-xs sm:text-sm" href="/upload">{t("upload")}</Link>

          {/* Autenticação em Desktop */}
          {user ? (
            <div className="hidden md:flex items-center gap-1.5">
              <Link className="btn text-xs sm:text-sm" href="/watchlist">
                {t("watchlist")}{unread > 0 && <span className="rounded-full bg-accent px-1.5 text-xs text-accent-ink" aria-label={`${unread} unread`}>{unread}</span>}
              </Link>
              <Link className="btn text-xs sm:text-sm" href={`/user/${encodeURIComponent(user.name)}`}>{user.name}</Link>
              <form action={logout}><button className="btn text-xs sm:text-sm">{t("logout")}</button></form>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5">
              <Link className="btn text-xs sm:text-sm" href="/login">{t("login")}</Link>
              <Link className="btn btn-primary text-xs sm:text-sm" href="/register">{t("register")}</Link>
            </div>
          )}

          {/* Seletor de Idiomas (Preserva ID para testes e acessibilidade) */}
          <LanguageSelector currentLocale={locale} id="language-select" />

          {/* Alternador de Tema Claro/Escuro */}
          <ThemeToggle />

          {/* Menu Gaveta para Navegação em Telemóveis */}
          <HeaderMobileDrawer
            currentLocale={locale}
            currentUser={user ? { name: user.name, email: user.email } : null}
            unread={unread}
            labels={drawerLabels}
          />
        </nav>
      </div>
    </header>
  );
}

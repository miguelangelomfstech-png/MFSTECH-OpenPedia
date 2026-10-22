"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { LanguageSelector } from "@/components/LanguageSelector";
import { dict, type Locale } from "@/lib/i18n-config";
import { logout } from "@/app/actions";

export interface SocialUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  image?: string | null;
}

interface SocialHeaderProps {
  currentLocale?: Locale;
  currentUser?: SocialUser | null;
  isAdmin?: boolean;
}

export function SocialHeader({ currentLocale = "pt", currentUser, isAdmin = false }: SocialHeaderProps) {
  const t = dict[currentLocale] || dict.pt;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Branding MFSTECH SOCIAL & Status Admin */}
        <div className="flex items-center gap-3">
          <Link href="/social" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-md transition-transform group-hover:scale-105">
              <Image
                src="/mfstech_logo.jpg"
                alt="MFSTECH SOCIAL"
                width={36}
                height={36}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  MFSTECH SOCIAL
                </span>
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                  {t.socialBadge}
                </span>
                {isAdmin && (
                  <span
                    data-testid="social-admin-indicator"
                    className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 shadow-xs"
                    title={t.socialAdminMode}
                  >
                    👑 {t.socialAdminBadge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                {t.socialSubtitle}
              </p>
            </div>
          </Link>
        </div>

        {/* Links Rápidos, Seletor de Idiomas, Controlo de Conta e Ações */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Seletor de Idiomas com 5 Línguas (PT, EN, ES, FR, IT) */}
          <div data-testid="social-language-selector">
            <LanguageSelector currentLocale={currentLocale} id="social-language-select" />
          </div>

          {/* Link para o YouTube Oficial */}
          <a
            href="https://www.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            id="header-youtube-link"
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/15 border border-red-500/30 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
            title="Aceder ao YouTube"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span className="hidden sm:inline">YouTube</span>
          </a>

          {/* Contacto Oficial */}
          <a
            href="mailto:mfstechsocial@gmail.com"
            id="header-contact-link"
            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 border border-neutral-800 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all"
            title="Email de Contacto: mfstechsocial@gmail.com"
          >
            <span>✉</span>
            <span className="hidden md:inline">mfstechsocial@gmail.com</span>
          </a>

          {/* Controlo de Conta (Login / Logout / Admin info) */}
          <div data-testid="social-account-control" className="flex items-center gap-1.5">
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/user/${encodeURIComponent(currentUser.name || "User")}`}
                  data-testid="social-user-profile-btn"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 border border-neutral-800 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:border-neutral-700 transition-all"
                  title={currentUser.email || currentUser.name || "Perfil"}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">
                    {(currentUser.name || "U").charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[100px] truncate">{currentUser.name}</span>
                  {isAdmin && <span className="text-amber-400 text-xs">👑</span>}
                </Link>

                <form action={logout}>
                  <button
                    type="submit"
                    data-testid="social-logout-btn"
                    className="inline-flex items-center rounded-xl bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-all"
                    title={t.socialLogout}
                  >
                    {t.socialLogout}
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login?next=/social"
                  data-testid="social-login-btn"
                  className="inline-flex items-center rounded-xl bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition-all shadow-md active:scale-95"
                  title={t.socialLogin}
                >
                  {t.socialLogin}
                </Link>
                <Link
                  href="/register?next=/social"
                  data-testid="social-register-btn"
                  className="hidden sm:inline-flex items-center rounded-xl bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all"
                  title={t.socialRegister}
                >
                  {t.socialRegister}
                </Link>
              </div>
            )}
          </div>

          {/* Voltar à Enciclopédia */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-xl bg-neutral-900 border border-neutral-800 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all"
          >
            <span>📖</span>
            <span className="hidden sm:inline">OpenPedia</span>
          </Link>
        </div>
      </div>
    </header>
  );
}


"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { logout } from "@/app/actions";
import { type Locale } from "@/lib/i18n-config";

interface HeaderMobileDrawerProps {
  currentLocale: Locale;
  currentUser?: { name?: string | null; email?: string | null } | null;
  unread?: number;
  labels: {
    startWriting: string;
    recent: string;
    upload: string;
    watchlist: string;
    login: string;
    register: string;
    logout: string;
    social: string;
  };
}

export function HeaderMobileDrawer({
  currentLocale,
  currentUser,
  unread = 0,
  labels,
}: HeaderMobileDrawerProps) {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao pressionar Escape ou clicar fora
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleClickOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={drawerRef} className="relative md:hidden">
      {/* Botão Hambúrguer Touch-Friendly (Mínimo 44x44px) */}
      <button
        type="button"
        id="header-mobile-menu-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Abrir Menu de Navegação"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink transition-colors hover:border-accent hover:bg-surface/80 active:scale-95"
      >
        <span className="text-lg leading-none" aria-hidden="true">
          {open ? "✕" : "☰"}
        </span>
      </button>

      {/* Painel Suspenso / Drawer Reflow para Telemóvel */}
      {open && (
        <div
          role="dialog"
          aria-label="Menu móvel"
          className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface/98 p-4 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3"
        >
          {/* Informação do Utilizador ou Login */}
          <div className="border-b border-line pb-3">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-ink text-xs font-bold">
                    {(currentUser.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-muted truncate">
                      {currentUser.email || "Utilizador MFSTECH"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/watchlist"
                    onClick={() => setOpen(false)}
                    className="btn !min-h-9 !py-1 text-xs justify-center"
                  >
                    {labels.watchlist}
                    {unread > 0 && (
                      <span className="rounded-full bg-accent px-1.5 text-[10px] text-accent-ink">
                        {unread}
                      </span>
                    )}
                  </Link>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="btn !min-h-9 !py-1 text-xs text-red-600 justify-center w-full"
                    >
                      {labels.logout}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn !min-h-10 text-xs justify-center font-semibold"
                >
                  {labels.login}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary !min-h-10 text-xs justify-center font-semibold"
                >
                  {labels.register}
                </Link>
              </div>
            )}
          </div>

          {/* Links Principais da Enciclopédia */}
          <div className="space-y-1">
            <Link
              href="/wiki/new/edit"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-ink hover:bg-bg transition-colors"
            >
              <span>✍️</span>
              <span>{labels.startWriting}</span>
            </Link>
            <Link
              href="/social"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-blue-500 hover:bg-blue-500/10 transition-colors"
            >
              <span>🌐</span>
              <span>{labels.social}</span>
            </Link>
            <Link
              href="/recent"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-ink hover:bg-bg transition-colors"
            >
              <span>🕒</span>
              <span>{labels.recent}</span>
            </Link>
            <Link
              href="/upload"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-ink hover:bg-bg transition-colors"
            >
              <span>📁</span>
              <span>{labels.upload}</span>
            </Link>
          </div>

          {/* Indicador de Design Responsivo */}
          <div className="border-t border-line pt-2 text-center">
            <p className="text-[10px] text-muted">
              📱 Adaptado para Telemóvel & Computador
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

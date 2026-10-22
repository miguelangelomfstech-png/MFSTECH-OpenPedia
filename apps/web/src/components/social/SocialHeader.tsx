"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function SocialHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Branding MFSTECH SOCIAL */}
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
                  Comunidade
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Vídeos, Fotografias & Interação em Tempo Real
              </p>
            </div>
          </Link>
        </div>

        {/* Links Rápidos e Ações */}
        <div className="flex items-center gap-2.5">
          {/* Link para o YouTube Oficial */}
          <a
            href="https://www.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            id="header-youtube-link"
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/15 border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all"
            title="Email de Contacto: mfstechsocial@gmail.com"
          >
            <span>✉</span>
            <span className="hidden md:inline">mfstechsocial@gmail.com</span>
          </a>

          {/* Voltar à Enciclopédia */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all"
          >
            <span>📖</span>
            <span className="hidden sm:inline">OpenPedia</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

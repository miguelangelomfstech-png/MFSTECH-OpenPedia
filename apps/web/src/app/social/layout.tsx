import type { Metadata } from "next";
import React from "react";
import { SocialHeader } from "@/components/social/SocialHeader";

export const metadata: Metadata = {
  title: "MFSTECH SOCIAL — Mídia Social, Vídeos & Fotografias",
  description:
    "Plataforma de mídia social e comunidade da MFSTECH. Reproduza vídeos do YouTube diretamente no site com link externo, visualize álbuns do Google Fotos e participe de discussões nos comentários.",
  openGraph: {
    title: "MFSTECH SOCIAL",
    description: "Conectando Conteúdos, Vídeos e Imagens com Máxima Liberdade e Performance.",
    siteName: "MFSTECH SOCIAL",
    images: [{ url: "/mfstech_logo.jpg" }],
  },
};

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-blue-600 selection:text-white flex flex-col">
      <SocialHeader />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-neutral-900 bg-neutral-950/80 py-8 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-4xl px-4 space-y-2">
          <p className="font-semibold text-neutral-400">
            MFSTECH SOCIAL © {new Date().getFullYear()} — Todos os direitos reservados.
          </p>
          <p>
            Contacto Oficial & Suporte:{" "}
            <a
              href="mailto:mfstechsocial@gmail.com"
              className="text-blue-400 hover:underline font-mono"
            >
              mfstechsocial@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

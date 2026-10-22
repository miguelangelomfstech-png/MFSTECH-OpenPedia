import type { Metadata } from "next";
import React from "react";
import { SocialHeader } from "@/components/social/SocialHeader";
import { getLocale } from "@/lib/i18n";
import { getViewer } from "@/lib/viewer";

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

export default async function SocialLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const { user, actor } = await getViewer();
  const isAdmin = actor.role === "admin" || actor.role === "bureaucrat" || user?.email === "mfstechsocial@gmail.com";

  const userSummary = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image ?? null,
      }
    : null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            #openpedia-global-header,
            #openpedia-global-footer {
              display: none !important;
            }
            #content {
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            body {
              background-color: #0a0a0a !important;
            }
          `,
        }}
      />
      <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-blue-600 selection:text-white flex flex-col w-full">
        <SocialHeader currentLocale={locale} currentUser={userSummary} isAdmin={isAdmin} />
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
    </>
  );
}

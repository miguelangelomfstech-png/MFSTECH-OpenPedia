# Master Prompt & Especificação Completa — MFSTECH SOCIAL

> **Projeto**: MFSTECH SOCIAL  
> **Contacto Oficial**: `mfstechsocial@gmail.com`  
> **Tipo de Plataforma**: Rede Social Multimédia Profissional (Vídeo, Fotografia, Interação e Comunidade)  
> **Padrão de Engenharia**: Next.js 15 (App Router), React 19, Tailwind CSS, Neon PostgreSQL, Drizzle ORM, Auth.js, i18n, RGPD, Playwright e Vercel.

---

## 1. Prompt Mestre Autónomo para Inicialização do Projeto

Copie e utilize o prompt abaixo para criar o projeto **MFSTECH SOCIAL** do zero com total autonomia:

```markdown
You are an Elite Principal Full-Stack Engineer and UX Architect. Your task is to build, test, brand, and deploy a state-of-the-art, enterprise-grade Social Media Platform named "MFSTECH SOCIAL".

### 1. IDENTITY & CONTACT
- Project Name: MFSTECH SOCIAL
- Contact Email: mfstechsocial@gmail.com
- Slogan: "Conectando Conteúdos, Vídeos e Imagens com Máxima Liberdade e Performance."

---

### 2. CORE ARCHITECTURE & TECH STACK
- Framework: Next.js 15 (App Router) with React 19 and TypeScript in strict mode.
- Styling: Tailwind CSS v4 with bespoke, rich dark/light mode aesthetics, glassmorphism headers, responsive feed layouts, and fluid micro-interactions.
- Database: Neon Serverless PostgreSQL with Drizzle ORM for type-safe relational persistence.
- Authentication: Auth.js (NextAuth v5) supporting credentials, secure session cookies, user profiles, and avatars.
- Internationalization (i18n): Native multi-language support for 5 languages:
  - Português (PT), English (EN), Español (ES), Français (FR), Italiano (IT).
- Regulatory Compliance: Full GDPR / RGPD compliance with floating cookie consent banner, persistence in localStorage/cookies, explicit consent on registration, and dedicated `/privacy` page identifying the contact email mfstechsocial@gmail.com.
- Testing Suite: End-to-end automated testing with Playwright covering all interactive features across Chromium, Firefox, WebKit, and Mobile Chrome.
- Deployment: Instant serverless production deployment on Vercel.

---

### 3. MANDATORY CORE FEATURES

#### 3.1. YouTube Video In-App Player & Direct Link Execution
- The platform allows users and administrators to paste YouTube video URLs (standard watch URLs, short youtu.be links, Shorts, and embed links).
- In-App Player: The site parses the YouTube Video ID and embeds a responsive, high-performance HTML5 player using the YouTube IFrame API or custom wrapper so visitors watch videos DIRECTLY inside MFSTECH SOCIAL without leaving the site.
- Direct YouTube Button: Next to or under every video player, render a dedicated action button:
  - "Assistir no YouTube" / "Watch on YouTube" (with the official YouTube icon) opening the original video in a new browser tab (`target="_blank" rel="noopener noreferrer"`).
- Automatic Metadata Extraction: Extract or allow entering video title, description, tags, channel name, and duration.

#### 3.2. Google Photos Gallery Integration
- Support pasting Google Photos shared album links or direct photo URLs.
- Render high-resolution responsive photo cards, carousel sliders, and a full-screen Lightbox modal with zoom and swipe navigation.
- Fallback & proxying: Graceful fallback with direct link button ("Ver no Google Fotos" / "Open in Google Photos") to handle cross-origin restrictions cleanly.

#### 3.3. Professional Interactive Comments System
- Dedicated comments section below every post, video, and photo:
  - Rich comment input box with avatar, character counter, emoji picker, and submit button.
  - Threaded replies support (replying to a specific comment).
  - Like / reaction counter on comments.
  - Real-time timestamp formatting (e.g., "há 5 minutos", "2 hours ago") aligned with the active language.
  - Moderation controls: Author and Admin can delete or hide inappropriate comments.
  - Anti-spam & rate limiting protection on submissions.

#### 3.4. Social Feed & Post Creation
- Feed view with filters: "Todos os Posts", "Vídeos YouTube", "Álbuns de Fotos", "Discussões".
- Post creator modal / widget:
  - Text body with Markdown and hashtag support (`#mfstech`, `#tecnologia`).
  - URL input with automatic type detection (YouTube video, Google Photos album, or standard web link).
  - Real-time preview before publishing.
  - Share button with clipboard copy and Web Share API.

#### 3.5. Branding, Privacy & i18n
- Official logo and header with notifications, search bar, language switcher (PT, EN, ES, FR, IT), and dark/light theme toggle.
- Contact footer featuring `mfstechsocial@gmail.com`.
- RGPD Banner with "Aceitar Todos", "Apenas Necessários" and link to `/privacy`.

---

### 4. DELIVERABLES REQUIRED
1. Complete monorepo source code with clean architecture.
2. Drizzle schema and migrations for `users`, `posts`, `media_links`, `comments`, and `likes`.
3. Complete Playwright test suite (`e2e/`) verifying:
   - YouTube in-app player rendering and external link click;
   - Google Photos integration;
   - Posting, rendering, and deleting comments;
   - i18n language switcher in all 5 languages;
   - GDPR consent banner and `/privacy` compliance.
4. Formal `DOCUMENTATION.md` and `TEST_PLAN.md` documents.
5. Live production deployment on Vercel.
```

---

## 2. Esquema de Banco de Dados Relacional Recomendado (Drizzle ORM)

```typescript
import { pgTable, text, timestamp, uuid, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const mediaTypeEnum = pgEnum("media_type", ["none", "youtube", "google_photos", "image", "external"]);
export const userRoleEnum = pgEnum("user_role", ["user", "moderator", "admin"]);

// 1. Utilizadores
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default("user").notNull(),
  bio: text("bio"),
  rgpdAcceptedAt: timestamp("rgpd_accepted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Publicações (Feed)
export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title"),
  content: text("content").notNull(),
  mediaType: mediaTypeEnum("media_type").default("none").notNull(),
  
  // YouTube Fields
  youtubeVideoId: text("youtube_video_id"),
  youtubeOriginalUrl: text("youtube_original_url"),
  
  // Google Photos Fields
  googlePhotosAlbumUrl: text("google_photos_album_url"),
  googlePhotosDirectUrls: text("google_photos_direct_urls").array(),
  
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Comentários
export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  parentId: uuid("parent_id"), // Para respostas em thread
  content: text("content").notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  isEdited: boolean("is_edited").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Reações / Likes
export const likes = pgTable("likes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## 3. Componentes Chave da Interface (React 19 / Next.js 15)

### 3.1. Player do YouTube com Botão Externo Integrado (`YouTubeEmbed.tsx`)

```tsx
"use client";

import React from "react";

interface YouTubeEmbedProps {
  videoId: string;
  originalUrl?: string;
  title?: string;
}

export function YouTubeEmbed({ videoId, originalUrl, title = "Vídeo do YouTube" }: YouTubeEmbedProps) {
  const watchUrl = originalUrl || `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="space-y-3 rounded-2xl bg-neutral-900/60 p-4 border border-neutral-800 shadow-xl backdrop-blur-md">
      {/* Container de Vídeo Proporcional 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>

      {/* Barra de Ações: Assistir Diretamente no YouTube */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-xs text-neutral-400 font-medium truncate">
          ▶ Em reprodução no MFSTECH SOCIAL
        </span>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-red-600/90 hover:bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-all shadow-md hover:shadow-red-900/30 active:scale-95 shrink-0"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          Assistir no YouTube ↗
        </a>
      </div>
    </div>
  );
}
```

### 3.2. Galeria do Google Fotos (`GooglePhotosGallery.tsx`)

```tsx
"use client";

import React, { useState } from "react";

interface GooglePhotosGalleryProps {
  albumUrl: string;
  photos?: string[];
  albumTitle?: string;
}

export function GooglePhotosGallery({ albumUrl, photos = [], albumTitle = "Álbum de Fotos" }: GooglePhotosGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div className="space-y-3 rounded-2xl bg-neutral-900/60 p-4 border border-neutral-800 shadow-xl">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
          <span className="text-blue-400">📷</span>
          <span>{albumTitle}</span>
        </div>
        <a
          href={albumUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline"
        >
          Abrir no Google Fotos ↗
        </a>
      </div>

      {/* Grid de Fotos */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {photos.slice(0, 6).map((src, index) => (
            <div
              key={index}
              onClick={() => setSelectedPhoto(src)}
              className="relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-neutral-800 hover:opacity-90 transition-all border border-neutral-700/50"
            >
              <img src={src} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-700 p-6 text-center">
          <p className="text-xs text-neutral-400 mb-3">Este álbum está disponível no Google Fotos.</p>
          <a
            href={albumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary text-xs"
          >
            Visualizar Álbum Completo ↗
          </a>
        </div>
      )}
    </div>
  );
}
```

### 3.3. Sistema de Comentários Completo (`CommentsSection.tsx`)

```tsx
"use client";

import React, { useState } from "react";

interface CommentItem {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
}

export function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    const addedComment: CommentItem = {
      id: Date.now().toString(),
      authorName: "Você",
      content: newComment.trim(),
      createdAt: "Agora mesmo",
      likes: 0,
    };
    setComments([addedComment, ...comments]);
    setNewComment("");
    setSubmitting(false);
  };

  return (
    <div className="mt-4 border-t border-neutral-800 pt-4 space-y-4">
      <h4 className="text-sm font-semibold text-neutral-200">
        Comentários ({comments.length})
      </h4>

      {/* Formulário de Envio de Comentário */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escreva um comentário profissional..."
          className="input flex-1 text-sm bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="btn btn-primary px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
        >
          {submitting ? "..." : "Comentar"}
        </button>
      </form>

      {/* Lista de Comentários */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-xl bg-neutral-900/40 p-3 border border-neutral-800/80">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
              <span className="font-semibold text-neutral-300">{comment.authorName}</span>
              <span>{comment.createdAt}</span>
            </div>
            <p className="text-sm text-neutral-200">{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 4. Plano de Testes Automatizados Playwright (`e2e/social-media.spec.ts`)

```typescript
import { test, expect } from "@playwright/test";

test.describe("MFSTECH SOCIAL — Testes de Qualidade E2E", () => {
  test("Exibe player de vídeo do YouTube e botão direto para o YouTube", async ({ page }) => {
    await page.goto("/feed");
    const ytCard = page.locator("[data-testid='youtube-post']").first();
    await expect(ytCard).toBeVisible();

    // Valida o iframe do YouTube
    const iframe = ytCard.locator("iframe");
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute("src", /youtube(-nocookie)?\.com\/embed\//);

    // Valida o link direto para assistir no YouTube
    const directLink = ytCard.locator("a:has-text('Assistir no YouTube')");
    await expect(directLink).toBeVisible();
    await expect(directLink).toHaveAttribute("target", "_blank");
    await expect(directLink).toHaveAttribute("href", /youtube\.com\/watch/);
  });

  test("Exibe integração com Google Fotos e link de redirecionamento", async ({ page }) => {
    await page.goto("/feed");
    const photosCard = page.locator("[data-testid='google-photos-post']").first();
    await expect(photosCard).toBeVisible();
    const photosLink = photosCard.locator("a:has-text('Google Fotos')");
    await expect(photosLink).toBeVisible();
    await expect(photosLink).toHaveAttribute("href", /photos\.app\.goo\.gl|photos\.google\.com/);
  });

  test("Permite escrever, enviar e visualizar comentários em tempo real", async ({ page }) => {
    await page.goto("/feed");
    const commentInput = page.locator("input[placeholder*='comentário']").first();
    await commentInput.fill("Excelente publicação e qualidade no MFSTECH SOCIAL!");
    await page.locator("button:has-text('Comentar')").first().click();

    await expect(page.locator("text=Excelente publicação e qualidade no MFSTECH SOCIAL!")).toBeVisible();
  });

  test("Garante conformidade RGPD e exibição do contacto oficial mfstechsocial@gmail.com", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("text=mfstechsocial@gmail.com")).toBeVisible();
  });
});
```

---

## 5. Contactos e Informações de Conformidade

- **Controlador dos Dados**: MFSTECH SOCIAL
- **Canal Oficial de Atendimento e DPO**: `mfstechsocial@gmail.com`
- **Direitos Garantidos (RGPD)**: Acesso, Retificação, Eliminação de comentários e posts, Portabilidade e Limitação de Tratamento.

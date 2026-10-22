/**
 * MFSTECH SOCIAL — Utilitários de Mídia e URLs
 * Suporte a YouTube e Google Fotos
 */

export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // 1. Formato: youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // 2. Formato: youtube.com/watch?v=ID ou youtube.com/v/ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // 3. Formato: youtube.com/embed/ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // 4. Formato: youtube.com/shorts/ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // 5. Se já for o ID direto de 11 caracteres
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return /youtube\.com|youtu\.be/i.test(url) || extractYouTubeVideoId(url) !== null;
}

export function isGooglePhotosUrl(url: string): boolean {
  if (!url) return false;
  return /photos\.app\.goo\.gl|photos\.google\.com/i.test(url);
}

export function buildYouTubeWatchUrl(videoId: string, originalUrl?: string | null): string {
  if (originalUrl && originalUrl.startsWith("http")) {
    return originalUrl;
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}

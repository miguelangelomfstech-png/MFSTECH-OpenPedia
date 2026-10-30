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
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  // 1. Links de álbuns ou partilha do Google Fotos
  if (/photos\.app\.goo\.gl|photos\.google\.com/i.test(trimmed)) return true;
  // 2. Endereço direto de foto do Google Fotos (lh3.googleusercontent.com, etc.)
  if (/googleusercontent\.com/i.test(trimmed)) return true;
  // 3. Imagens do Google Drive
  if (/drive\.google\.com/i.test(trimmed)) return true;
  // 4. Data URL de imagem (upload direto do dispositivo)
  if (/^data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(trimmed)) return true;
  // 5. Links diretos para imagens (.jpg, .jpeg, .png, .webp, .gif, .svg)
  if (/\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(trimmed)) return true;
  return false;
}

export function isDirectImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (/^data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(trimmed)) return true;
  if (/googleusercontent\.com/i.test(trimmed)) return true;
  if (/\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(trimmed)) return true;
  if (/drive\.google\.com\/uc\?/i.test(trimmed)) return true;
  return false;
}

export function isVideoUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  // 1. Data URLs para vídeos gravados ou enviados pelo utilizador
  if (/^data:video\/[a-zA-Z0-9+.-]+;base64,/i.test(trimmed)) return true;
  // 2. Ficheiros diretos de vídeo (.mp4, .webm, .ogg, .mov, .m4v)
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(trimmed)) return true;
  // 3. URLs com indicação clara de stream de vídeo
  if (/blob:http/i.test(trimmed)) return true;
  return false;
}

export function normalizePhotoUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  // Converter link de partilha do Google Drive para visualização direta
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }

  return trimmed;
}

export function buildYouTubeWatchUrl(videoId: string, originalUrl?: string | null): string {
  if (originalUrl && originalUrl.startsWith("http")) {
    return originalUrl;
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}


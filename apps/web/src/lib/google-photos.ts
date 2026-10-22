/**
 * MFSTECH SOCIAL — Google Photos & Media Extractor
 * Suporta links diretos, upload de fotos, e extração de álbuns públicos do Google Fotos
 */

export interface GooglePhotosResolved {
  directUrl: string | null;
  photos: string[];
  title?: string | null;
  originalUrl: string;
}

export async function resolveGooglePhotosMedia(url: string): Promise<GooglePhotosResolved> {
  if (!url || typeof url !== "string") {
    return { directUrl: null, photos: [], originalUrl: "" };
  }

  const trimmed = url.trim();

  // 1. Data URLs (Upload direto do dispositivo)
  if (/^data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(trimmed)) {
    return {
      directUrl: trimmed,
      photos: [trimmed],
      originalUrl: trimmed,
    };
  }

  // 2. Imagens diretas (Googleusercontent ou extensões padrão)
  if (
    /googleusercontent\.com/i.test(trimmed) ||
    /\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(trimmed)
  ) {
    let cleanUrl = trimmed;
    // Se for do googleusercontent e não tiver modificador de tamanho, adiciona w1200 para alta resolução
    if (/googleusercontent\.com/i.test(cleanUrl) && !/=[swh]\d+/i.test(cleanUrl)) {
      cleanUrl = `${cleanUrl}=w1200`;
    }
    return {
      directUrl: cleanUrl,
      photos: [cleanUrl],
      originalUrl: trimmed,
    };
  }

  // 3. Links do Google Drive
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    const directDrive = `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    return {
      directUrl: directDrive,
      photos: [directDrive],
      originalUrl: trimmed,
    };
  }

  // 4. Álbuns ou links de partilha do Google Fotos (photos.app.goo.gl ou photos.google.com)
  if (/photos\.app\.goo\.gl|photos\.google\.com/i.test(trimmed)) {
    try {
      const response = await fetch(trimmed, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(4000),
      });

      if (response.ok) {
        const html = await response.text();

        // Tenta extrair o título
        let albumTitle: string | null = null;
        const ogTitleMatch = html.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i);
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          albumTitle = ogTitleMatch[1].trim();
        } else if (titleMatch && titleMatch[1]) {
          albumTitle = titleMatch[1].replace(/ - Google Fotos$/i, "").replace(/ - Google Photos$/i, "").trim();
        }

        // Tenta extrair foto de capa via og:image
        const ogImageMatch = html.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
        const coverPhoto = ogImageMatch && ogImageMatch[1] ? ogImageMatch[1] : null;

        // Procura todos os links lh3.googleusercontent.com no payload JSON embutido na página
        const lhPattern = /https:\/\/lh[3-6]\.googleusercontent\.com\/[a-zA-Z0-9\-_]{25,}/g;
        const matches = html.match(lhPattern) || [];

        // Filtra fotos únicas e descarta ícones pequenos de perfil
        const seen = new Set<string>();
        const photos: string[] = [];

        if (coverPhoto && !seen.has(coverPhoto)) {
          seen.add(coverPhoto);
          photos.push(coverPhoto.includes("=") ? coverPhoto : `${coverPhoto}=w1200`);
        }

        for (const match of matches) {
          // Ignorar avatares conhecidos ou links excessivamente curtos
          if (!seen.has(match) && match.length > 40) {
            seen.add(match);
            photos.push(`${match}=w1200`);
            if (photos.length >= 6) break;
          }
        }

        return {
          directUrl: photos[0] || null,
          photos,
          title: albumTitle,
          originalUrl: trimmed,
        };
      }
    } catch (err) {
      console.warn("Could not fetch Google Photos album details:", err);
    }

    return {
      directUrl: null,
      photos: [],
      originalUrl: trimmed,
    };
  }

  return { directUrl: null, photos: [], originalUrl: trimmed };
}

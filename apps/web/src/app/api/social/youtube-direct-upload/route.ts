import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/social/youtube-direct-upload
 * Recebe o vídeo capturado (data URL / base64), envia diretamente para a YouTube Data API v3
 * e devolve o link/ID do YouTube para ser vinculado diretamente ao post, poupando o servidor da Vercel.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { videoData, title } = body;

    if (!videoData || typeof videoData !== "string") {
      return NextResponse.json({ success: false, error: "Nenhum vídeo fornecido." }, { status: 400 });
    }

    // 1. Extrair mimeType e buffer binário do vídeo em base64
    const matches = videoData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = "video/webm";
    let buffer: Buffer;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(videoData, "base64");
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.AUTH_GOOGLE_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET;
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

    // Se as credenciais do canal do YouTube estiverem configuradas, faz o envio real para a API do YouTube
    if (clientId && clientSecret && refreshToken) {
      // 1. Obter Access Token atualizado via OAuth 2.0 Refresh Token
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || "Falha na autenticação com a API do YouTube.");
      }

      const accessToken = tokenData.access_token;

      // 2. Metadados do vídeo para o canal do YouTube
      const metadata = {
        snippet: {
          title: title || `MFSTECH Social Video - ${new Date().toLocaleDateString("pt-PT")}`,
          description: "Vídeo gravado e publicado diretamente através da rede social MFSTECH SOCIAL.",
          tags: ["MFSTECH", "Social", "Video"],
          categoryId: "22", // People & Blogs
        },
        status: {
          privacyStatus: "unlisted", // Não-listado por padrão para privacidade
          selfDeclaredMadeForKids: false,
        },
      };

      // 3. Iniciar sessão de upload resumable do YouTube
      const initRes = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Type": mimeType,
            "X-Upload-Content-Length": buffer.length.toString(),
          },
          body: JSON.stringify(metadata),
        }
      );

      if (!initRes.ok) {
        throw new Error(`Erro ao iniciar sessão de upload do YouTube (${initRes.status}).`);
      }

      const uploadUrl = initRes.headers.get("Location");
      if (!uploadUrl) {
        throw new Error("URL de upload resumable do YouTube não foi devolvida.");
      }

      // 4. Enviar os bytes do vídeo para o YouTube
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
          "Content-Length": buffer.length.toString(),
        },
        body: new Uint8Array(buffer),
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.id) {
        throw new Error(uploadData.error?.message || "Falha ao enviar vídeo para o YouTube.");
      }

      const youtubeVideoId = uploadData.id;
      const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;

      return NextResponse.json({
        success: true,
        youtubeVideoId,
        youtubeUrl,
        message: "Vídeo enviado e salvo com sucesso no YouTube!",
      });
    }

    // Se YOUTUBE_REFRESH_TOKEN ainda não estiver definido no ambiente:
    // Retorna indicação de que o token precisa ser inserido no .env / Vercel
    return NextResponse.json({
      success: false,
      configured: false,
      message: "Credenciais YOUTUBE_REFRESH_TOKEN não configuradas no ambiente.",
    });
  } catch (error: any) {
    console.error("POST /api/social/youtube-direct-upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao processar envio para o YouTube.",
      },
      { status: 500 }
    );
  }
}


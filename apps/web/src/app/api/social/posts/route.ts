import { NextResponse } from "next/server";
import { db, socialPosts, socialComments, desc, eq } from "@wiki/db";
import { extractYouTubeVideoId, isGooglePhotosUrl, isYouTubeUrl } from "@/lib/social-media";

export const dynamic = "force-dynamic";

/**
 * GET /api/social/posts
 * Retorna todas as publicações do MFSTECH SOCIAL com os respetivos comentários.
 */
export async function GET() {
  try {
    const posts = await db
      .select()
      .from(socialPosts)
      .orderBy(desc(socialPosts.createdAt));

    // Buscar comentários para cada publicação
    const comments = await db
      .select()
      .from(socialComments)
      .orderBy(desc(socialComments.createdAt));

    const commentsByPost = comments.reduce<Record<string, typeof comments>>((acc, comment) => {
      acc[comment.postId] = acc[comment.postId] || [];
      acc[comment.postId].push(comment);
      return acc;
    }, {});

    const enrichedPosts = posts.map((post) => ({
      ...post,
      comments: commentsByPost[post.id] || [],
    }));

    return NextResponse.json({
      success: true,
      data: enrichedPosts,
      contactEmail: "mfstechsocial@gmail.com",
    });
  } catch (error) {
    console.error("GET /api/social/posts error:", error);
    return NextResponse.json({ success: false, error: "Erro ao buscar publicações." }, { status: 500 });
  }
}

/**
 * POST /api/social/posts
 * Cria uma nova publicação no MFSTECH SOCIAL.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, authorName, authorEmail, mediaUrl, googlePhotosTitle } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ success: false, error: "O conteúdo da publicação é obrigatório." }, { status: 400 });
    }

    let mediaType: "none" | "youtube" | "google_photos" = "none";
    let youtubeVideoId: string | null = null;
    let youtubeUrl: string | null = null;
    let googlePhotosUrl: string | null = null;

    // Detectar link de mídia ou no campo mediaUrl ou no texto do conteúdo
    const potentialUrl = (mediaUrl || "").trim() || (content.match(/https?:\/\/[^\s]+/)?.[0] ?? "");

    if (potentialUrl) {
      if (isYouTubeUrl(potentialUrl)) {
        const vid = extractYouTubeVideoId(potentialUrl);
        if (vid) {
          mediaType = "youtube";
          youtubeVideoId = vid;
          youtubeUrl = potentialUrl;
        }
      } else if (isGooglePhotosUrl(potentialUrl)) {
        mediaType = "google_photos";
        googlePhotosUrl = potentialUrl;
      }
    }

    const [newPost] = await db
      .insert(socialPosts)
      .values({
        title: title ? String(title).trim() : null,
        content: content.trim(),
        authorName: authorName ? String(authorName).trim() : "Utilizador MFSTECH",
        authorEmail: authorEmail ? String(authorEmail).trim() : "mfstechsocial@gmail.com",
        mediaType,
        youtubeVideoId,
        youtubeUrl,
        googlePhotosUrl,
        googlePhotosTitle: googlePhotosTitle ? String(googlePhotosTitle).trim() : null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        ...newPost,
        comments: [],
      },
      message: "Publicação criada com sucesso!",
    });
  } catch (error) {
    console.error("POST /api/social/posts error:", error);
    return NextResponse.json({ success: false, error: "Erro ao criar publicação." }, { status: 500 });
  }
}

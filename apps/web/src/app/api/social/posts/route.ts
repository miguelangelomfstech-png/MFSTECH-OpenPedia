import { NextResponse } from "next/server";
import { db, socialPosts, socialComments, desc, eq } from "@wiki/db";
import { extractYouTubeVideoId, isGooglePhotosUrl, isYouTubeUrl, isVideoUrl, normalizePhotoUrl } from "@/lib/social-media";
import { getViewer } from "@/lib/viewer";

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
    const raw = await req.text();
    if (!raw || !raw.trim()) {
      return NextResponse.json({ success: false, error: "Corpo da requisição vazio." }, { status: 400 });
    }
    const body = JSON.parse(raw);
    const { title, content, authorName, authorEmail, mediaUrl, googlePhotosTitle } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ success: false, error: "O conteúdo da publicação é obrigatório." }, { status: 400 });
    }

    let mediaType: "none" | "youtube" | "google_photos" | "external" = "none";
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
      } else if (isVideoUrl(potentialUrl)) {
        mediaType = "external";
        googlePhotosUrl = potentialUrl;
      } else if (isGooglePhotosUrl(potentialUrl)) {
        mediaType = "google_photos";
        googlePhotosUrl = normalizePhotoUrl(potentialUrl);
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

/**
 * DELETE /api/social/posts
 * Remove uma publicação e todos os seus comentários associados.
 * Apenas Administradores ou o autor da publicação podem remover.
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID da publicação é obrigatório." }, { status: 400 });
    }

    const { user, actor } = await getViewer();
    const isAdmin = actor.role === "admin" || actor.role === "bureaucrat" || user?.email === "mfstechsocial@gmail.com";

    // Buscar a publicação
    const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
    if (!post) {
      return NextResponse.json({ success: false, error: "Publicação não encontrada." }, { status: 404 });
    }

    // Validação de permissões: admin ou autor do post
    const isAuthor = user && post.authorEmail && user.email?.toLowerCase() === post.authorEmail.toLowerCase();
    if (!isAdmin && !isAuthor) {
      return NextResponse.json(
        { success: false, error: "Não tem permissão de administrador para remover esta publicação." },
        { status: 403 }
      );
    }

    // Remover publicação (os comentários são removidos automaticamente via cascata onDelete na BD)
    await db.delete(socialPosts).where(eq(socialPosts.id, id));

    return NextResponse.json({
      success: true,
      message: "Publicação removida com sucesso.",
    });
  } catch (error) {
    console.error("DELETE /api/social/posts error:", error);
    return NextResponse.json({ success: false, error: "Erro ao remover publicação." }, { status: 500 });
  }
}


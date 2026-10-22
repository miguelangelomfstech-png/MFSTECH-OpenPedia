import { NextResponse } from "next/server";
import { db, socialComments, socialPosts, eq, sql } from "@wiki/db";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * POST /api/social/comments
 * Adiciona um comentário a uma publicação no MFSTECH SOCIAL.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { postId, content, authorName, authorEmail } = body;

    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ success: false, error: "ID da publicação inválido." }, { status: 400 });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ success: false, error: "O comentário não pode estar vazio." }, { status: 400 });
    }

    // Inserir comentário
    const [newComment] = await db
      .insert(socialComments)
      .values({
        postId,
        content: content.trim(),
        authorName: authorName ? String(authorName).trim() : "Membro da Comunidade",
        authorEmail: authorEmail ? String(authorEmail).trim() : null,
      })
      .returning();

    // Incrementar contagem de comentários na publicação
    await db
      .update(socialPosts)
      .set({
        commentsCount: sql`${socialPosts.commentsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, postId));

    return NextResponse.json({
      success: true,
      data: newComment,
      message: "Comentário adicionado com sucesso!",
    });
  } catch (error) {
    console.error("POST /api/social/comments error:", error);
    return NextResponse.json({ success: false, error: "Erro ao adicionar comentário." }, { status: 500 });
  }
}

/**
 * DELETE /api/social/comments
 * Remove um comentário.
 * Apenas Administradores ou o autor do comentário podem remover.
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID do comentário é obrigatório." }, { status: 400 });
    }

    const { user, actor } = await getViewer();
    const isAdmin = actor.role === "admin" || actor.role === "bureaucrat" || user?.email === "mfstechsocial@gmail.com";

    const [comment] = await db.select().from(socialComments).where(eq(socialComments.id, id));
    if (!comment) {
      return NextResponse.json({ success: false, error: "Comentário não encontrado." }, { status: 404 });
    }

    const isAuthor = user && comment.authorEmail && user.email?.toLowerCase() === comment.authorEmail.toLowerCase();
    if (user && !isAdmin && !isAuthor) {
      return NextResponse.json(
        { success: false, error: "Não tem permissão para remover este comentário." },
        { status: 403 }
      );
    }

    const [deleted] = await db
      .delete(socialComments)
      .where(eq(socialComments.id, id))
      .returning();

    if (deleted) {
      await db
        .update(socialPosts)
        .set({
          commentsCount: sql`GREATEST(0, ${socialPosts.commentsCount} - 1)`,
        })
        .where(eq(socialPosts.id, deleted.postId));
    }

    return NextResponse.json({ success: true, message: "Comentário removido com sucesso." });
  } catch (error) {
    console.error("DELETE /api/social/comments error:", error);
    return NextResponse.json({ success: false, error: "Erro ao remover comentário." }, { status: 500 });
  }
}


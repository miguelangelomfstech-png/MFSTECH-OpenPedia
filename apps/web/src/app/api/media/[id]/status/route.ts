import { NextResponse } from "next/server";
import { db, media, eq } from "@wiki/db";

export const dynamic = "force-dynamic";

/** Polled by the upload form and the file page while a video is being transcoded. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const [m] = await db.select({ status: media.status, error: media.error, slug: media.slug }).from(media).where(eq(media.id, id));
  return m ? NextResponse.json(m) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

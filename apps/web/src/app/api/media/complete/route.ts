import { NextResponse } from "next/server";
import { z } from "zod";
import { db, media, eq, and } from "@wiki/db";
import { enqueueMedia, headObject } from "@wiki/shared";
import { getViewer } from "@/lib/viewer";

/** Step 2: after the browser finished the PUT, verify the object and queue processing. */
export async function POST(req: Request) {
  const { user } = await getViewer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ mediaId: z.string().uuid() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const [m] = await db.select().from(media)
    .where(and(eq(media.id, parsed.data.mediaId), eq(media.uploaderId, user.id)));
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (m.status !== "pending") return NextResponse.json({ status: m.status });

  const head = await headObject(m.originalKey);
  if (!head) return NextResponse.json({ error: "Upload not found in storage." }, { status: 400 });
  if (head.size !== m.size) {
    await db.update(media).set({ status: "failed", error: "Size mismatch" }).where(eq(media.id, m.id));
    return NextResponse.json({ error: "Uploaded size does not match." }, { status: 400 });
  }
  await db.update(media).set({ status: "processing" }).where(eq(media.id, m.id));
  await enqueueMedia({ mediaId: m.id });
  return NextResponse.json({ status: "processing", slug: m.slug });
}

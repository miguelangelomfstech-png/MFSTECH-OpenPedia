import { NextResponse } from "next/server";
import { z } from "zod";
import { db, media } from "@wiki/db";
import { LIMITS, env, mediaKind, presignUpload, rateLimit, slugify } from "@wiki/shared";
import { getViewer } from "@/lib/viewer";

const body = z.object({
  filename: z.string().trim().min(3).max(150).regex(/^[^\/\\<>:"|?*]+\.[A-Za-z0-9]{2,5}$/, "Invalid file name"),
  mimeType: z.string(),
  size: z.number().int().positive(),
  description: z.string().max(2000).default(""),
  altText: z.string().max(300).default(""),
  license: z.string().max(100).default("unspecified"),
  source: z.string().max(500).default(""),
});

/** Step 1: validate metadata, create a pending row, hand the browser a presigned PUT URL. */
export async function POST(req: Request) {
  const { user, actor } = await getViewer();
  if (!user || actor.blocked) return NextResponse.json({ error: "Log in to upload files." }, { status: 401 });
  if (!(await rateLimit(`upload:${user.id}`, LIMITS.upload.limit, LIMITS.upload.window)).ok) {
    return NextResponse.json({ error: "Upload limit reached. Try again later." }, { status: 429 });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;

  const kind = mediaKind(d.mimeType);
  if (!kind) return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
  const max = (kind === "image" ? env().MAX_IMAGE_MB : env().MAX_VIDEO_MB) * 1024 * 1024;
  if (d.size > max) return NextResponse.json({ error: `File too large (max ${max / 1048576} MB).` }, { status: 413 });

  const filename = d.filename.replace(/\s+/g, "_");
  const slug = slugify(filename);
  const id = crypto.randomUUID();
  const key = `originals/${id}/${filename}`;
  try {
    await db.insert(media).values({
      id, uploaderId: user.id, kind, filename, slug, originalKey: key, mimeType: d.mimeType, size: d.size,
      description: d.description, altText: d.altText, license: d.license, source: d.source,
    });
  } catch {
    return NextResponse.json({ error: "A file with that name already exists. Rename it and retry." }, { status: 409 });
  }
  const uploadUrl = await presignUpload(key, d.mimeType, d.size);
  return NextResponse.json({ mediaId: id, uploadUrl, slug });
}

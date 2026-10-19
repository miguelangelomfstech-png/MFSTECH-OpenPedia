import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db, media, mediaRenditions, users, eq } from "@wiki/db";
import { publicUrl, slugify } from "@wiki/shared";
import { VideoPlayer } from "@/components/VideoPlayer";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const [m] = await db.select({ m: media, uploader: users.name }).from(media)
    .leftJoin(users, eq(users.id, media.uploaderId)).where(eq(media.slug, slugify(decodeURIComponent(slug))));
  if (!m) return null;
  const rends = await db.select().from(mediaRenditions).where(eq(mediaRenditions.mediaId, m.m.id));
  return { ...m, rends };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await load((await params).slug);
  if (!d) return { title: "File not found" };
  const thumb = d.rends.find((r) => r.label === "webp-800" || r.label === "poster");
  return {
    title: `File:${d.m.filename}`, description: d.m.description.slice(0, 160),
    openGraph: { images: thumb ? [publicUrl(thumb.key)] : undefined },
  };
}

export default async function FilePage({ params }: Props) {
  const d = await load((await params).slug);
  if (!d) notFound();
  const { m, rends, uploader } = d;
  const r = (l: string) => rends.find((x) => x.label === l);
  const sources = ["360p", "720p", "1080p"].map(r).filter(Boolean).map((x) => ({ label: x!.label, url: publicUrl(x!.key), height: x!.height }));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-3xl font-bold">File:{m.filename}</h1>
      <div className="mt-6">
        {m.status !== "ready" ? (
          <p className="card p-6" role="status">{m.status === "failed" ? `Processing failed: ${m.error}` : "This file is still being processed. Refresh in a moment."}</p>
        ) : m.kind === "video" ? (
          <VideoPlayer sources={sources} poster={r("poster") ? publicUrl(r("poster")!.key) : undefined} alt={m.altText || m.filename} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicUrl((r("webp-1600") ?? r("webp-800") ?? { key: m.originalKey }).key)} alt={m.altText || m.filename} className="w-full rounded-2xl border border-line" />
        )}
      </div>
      <section aria-labelledby="meta" className="card mt-8 p-6">
        <h2 id="meta" className="font-semibold">File information</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-muted">Description</dt><dd>{m.description || "—"}</dd>
          <dt className="text-muted">Alt text</dt><dd>{m.altText || "—"}</dd>
          <dt className="text-muted">License</dt><dd>{m.license}</dd>
          <dt className="text-muted">Source</dt><dd>{m.source || "—"}</dd>
          <dt className="text-muted">Uploaded by</dt><dd>{uploader ?? "unknown"} on {m.createdAt.toISOString().slice(0, 10)}</dd>
          <dt className="text-muted">Dimensions</dt><dd>{m.width && m.height ? `${m.width} × ${m.height}` : "—"}{m.durationSec ? `, ${Math.round(m.durationSec)} s` : ""}</dd>
          <dt className="text-muted">Size</dt><dd>{(m.size / 1048576).toFixed(2)} MB ({m.mimeType})</dd>
          <dt className="text-muted">Downloads</dt>
          <dd className="flex flex-wrap gap-3">
            <a className="text-accent underline" href={publicUrl(m.originalKey)} download>Original</a>
            {sources.map((s) => <a key={s.label} className="text-accent underline" href={s.url} download>{s.label}</a>)}
          </dd>
          <dt className="text-muted">Embed code</dt><dd><code>[[File:{m.filename}|Caption]]</code></dd>
        </dl>
      </section>
    </div>
  );
}

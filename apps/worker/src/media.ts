import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";
import { db, media, mediaRenditions, eq, type Media } from "@wiki/db";
import { VIDEO_LADDER, enqueueSearch, getObjectStream, putObject } from "@wiki/shared";

const run = (cmd: string, args: string[]) =>
  new Promise<string>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err = (err + d).slice(-4000)));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} exited ${code}: ${err}`))));
  });

type Rendition = { label: string; key: string; mimeType: string; width: number | null; height: number | null; size: number };

async function upload(m: Media, label: string, file: string, mime: string, ext: string, w: number | null, h: number | null): Promise<Rendition> {
  const key = `derived/${m.id}/${label}.${ext}`;
  const body = await readFile(file);
  await putObject({ Key: key, Body: body, ContentType: mime });
  return { label, key, mimeType: mime, width: w, height: h, size: body.length };
}

async function processImage(m: Media, src: string, dir: string) {
  const meta = await sharp(src, { animated: false }).metadata();
  const width = meta.width ?? null;
  const height = meta.height ?? null;
  const out: Rendition[] = [];
  const targets: [string, number][] = [["thumb-400", 400], ["webp-800", 800], ["webp-1600", 1600]];
  for (const [label, w] of targets) {
    if (label !== "thumb-400" && width && width <= w / 2) continue; // never upscale much
    const file = path.join(dir, `${label}.webp`);
    const info = await sharp(src, { animated: false }).rotate()
      .resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toFile(file);
    out.push(await upload(m, label, file, "image/webp", "webp", info.width, info.height));
  }
  return { width, height, durationSec: null as number | null, renditions: out };
}

async function processVideo(m: Media, src: string, dir: string) {
  const probe = JSON.parse(await run("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", src]));
  const v = probe.streams?.find((s: { codec_type: string }) => s.codec_type === "video");
  if (!v) throw new Error("No video stream found");
  const hasAudio = probe.streams.some((s: { codec_type: string }) => s.codec_type === "audio");
  const srcW: number = v.width;
  const srcH: number = v.height;
  const duration = Number(probe.format?.duration ?? v.duration ?? 0);
  if (!duration || duration > 4 * 3600) throw new Error("Invalid or too long duration");

  let ladder = VIDEO_LADDER.filter((l) => l.height <= srcH + 8);
  if (!ladder.length) ladder = [VIDEO_LADDER[0]]; // tiny sources still get one MP4
  const out: Rendition[] = [];

  for (const step of ladder) {
    const h = Math.min(step.height, srcH - (srcH % 2));
    const file = path.join(dir, `${step.label}.mp4`);
    await run("ffmpeg", [
      "-y", "-i", src, "-map", "0:v:0", ...(hasAudio ? ["-map", "0:a:0"] : []),
      "-vf", `scale=-2:${h}`, "-c:v", "libx264", "-preset", "veryfast", "-crf", String(step.crf),
      "-profile:v", "high", "-pix_fmt", "yuv420p", "-g", "60", "-movflags", "+faststart",
      ...(hasAudio ? ["-c:a", "aac", "-b:a", `${step.audioKbps}k`, "-ac", "2"] : ["-an"]),
      file,
    ]);
    const w = Math.round((srcW / srcH) * h / 2) * 2;
    out.push(await upload(m, step.label, file, "video/mp4", "mp4", w, h));
  }

  const frame = path.join(dir, "poster.jpg");
  await run("ffmpeg", ["-y", "-ss", String(Math.min(1, duration / 10)), "-i", src, "-frames:v", "1", "-vf", "scale=1280:-2", "-q:v", "3", frame]);
  out.push(await upload(m, "poster", frame, "image/jpeg", "jpg", null, null));
  const thumb = path.join(dir, "thumb.webp");
  const info = await sharp(frame).resize({ width: 400 }).webp({ quality: 78 }).toFile(thumb);
  out.push(await upload(m, "thumb-400", thumb, "image/webp", "webp", info.width, info.height));

  return { width: srcW, height: srcH, durationSec: duration, renditions: out };
}

export async function processMedia(mediaId: string) {
  const [m] = await db.select().from(media).where(eq(media.id, mediaId));
  if (!m) throw new Error(`media ${mediaId} not found`);
  await db.update(media).set({ status: "processing", error: null }).where(eq(media.id, m.id));

  const dir = await mkdtemp(path.join(tmpdir(), "media-"));
  try {
    const src = path.join(dir, "original" + path.extname(m.filename));
    await pipeline(await getObjectStream(m.originalKey), createWriteStream(src));
    if ((await stat(src)).size === 0) throw new Error("Empty upload");

    const res = m.kind === "video" ? await processVideo(m, src, dir) : await processImage(m, src, dir);

    await db.transaction(async (tx) => {
      await tx.delete(mediaRenditions).where(eq(mediaRenditions.mediaId, m.id));
      await tx.insert(mediaRenditions).values(res.renditions.map((r) => ({ ...r, mediaId: m.id })));
      await tx.update(media).set({
        status: "ready", width: res.width, height: res.height, durationSec: res.durationSec,
      }).where(eq(media.id, m.id));
    });
    await enqueueSearch({ type: "media", mediaId: m.id });
    console.log(`media ${m.filename} ready (${res.renditions.map((r) => r.label).join(", ")})`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function markFailed(mediaId: string, message: string) {
  await db.update(media).set({ status: "failed", error: message.slice(0, 1000) }).where(eq(media.id, mediaId));
}

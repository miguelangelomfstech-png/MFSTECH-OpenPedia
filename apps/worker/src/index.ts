import http from "node:http";
import { Worker } from "bullmq";
import {
  QUEUES, bullConnection, ensureIndexes, env, type MediaJob, type SearchJob,
} from "@wiki/shared";
import { markFailed, processMedia } from "./media";
import { indexJob } from "./search";

env();
const imageConcurrency = Number(process.env.WORKER_CONCURRENCY_IMAGE ?? 4);
const videoSlots = Number(process.env.WORKER_CONCURRENCY_VIDEO ?? 1);

// FFmpeg is CPU-heavy: cap simultaneous video jobs even though images run wide.
let activeVideo = 0;
const waiters: (() => void)[] = [];
async function withVideoSlot<T>(fn: () => Promise<T>) {
  while (activeVideo >= videoSlots) await new Promise<void>((r) => waiters.push(r));
  activeVideo++;
  try { return await fn(); } finally { activeVideo--; waiters.shift()?.(); }
}

async function main() {
  await ensureIndexes().catch((e) => console.warn("could not configure search indexes yet:", e.message));

  const mediaWorker = new Worker<MediaJob>(
    QUEUES.media,
    async (job) => {
      const { db, media, eq } = await import("@wiki/db");
      const [m] = await db.select({ kind: media.kind }).from(media).where(eq(media.id, job.data.mediaId));
      return m?.kind === "video" ? withVideoSlot(() => processMedia(job.data.mediaId)) : processMedia(job.data.mediaId);
    },
    { connection: bullConnection(), concurrency: imageConcurrency + videoSlots, lockDuration: 10 * 60_000 },
  );
  mediaWorker.on("failed", async (job, err) => {
    console.error("media job failed", job?.id, err.message);
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) await markFailed(job.data.mediaId, err.message);
  });

  const searchWorker = new Worker<SearchJob>(QUEUES.search, (job) => indexJob(job.data), {
    connection: bullConnection(), concurrency: 4,
  });
  searchWorker.on("failed", (job, err) => console.error("search job failed", job?.id, err.message));

  http.createServer((_req, res) => { res.end("ok"); }).listen(3001);
  console.log("worker started");

  const shutdown = async () => {
    console.log("shutting down");
    await Promise.all([mediaWorker.close(), searchWorker.close()]);
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((e) => { console.error(e); process.exit(1); });

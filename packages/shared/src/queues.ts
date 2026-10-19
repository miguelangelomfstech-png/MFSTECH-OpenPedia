import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "./env";

export const QUEUES = { media: "media-processing", search: "search-index" } as const;

export type MediaJob = { mediaId: string };
export type SearchJob =
  | { type: "article"; articleId: string }
  | { type: "media"; mediaId: string }
  | { type: "delete-article"; articleId: string };

const g = globalThis as unknown as { __redis?: IORedis; __queues?: Record<string, Queue> };

/** Shared connection for general use (rate limiting, cache). */
export function redis(): IORedis {
  return (g.__redis ??= new IORedis(env().REDIS_URL, { maxRetriesPerRequest: null }));
}

/** BullMQ requires its own connection config with maxRetriesPerRequest=null. */
export function bullConnection() {
  return new IORedis(env().REDIS_URL, { maxRetriesPerRequest: null });
}

function queue(name: string): Queue {
  g.__queues ??= {};
  return (g.__queues[name] ??= new Queue(name, {
    connection: redis(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 7 * 24 * 3600 },
    },
  }));
}

export const enqueueMedia = (job: MediaJob) =>
  queue(QUEUES.media).add("process", job, { jobId: `media-${job.mediaId}` });

export const enqueueSearch = (job: SearchJob) => {
  const id = job.type === "media" ? job.mediaId : job.articleId;
  // Unique-per-timestamp ids would defeat dedupe; coalesce bursts of edits instead.
  return queue(QUEUES.search).add("index", job, { delay: 1000, jobId: `${job.type}-${id}-${Math.floor(Date.now() / 2000)}` });
};

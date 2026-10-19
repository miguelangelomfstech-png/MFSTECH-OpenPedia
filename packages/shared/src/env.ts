import { z } from "zod";

const bool = z.enum(["true", "false"]).default("false").transform((v) => v === "true");

const schema = z.object({
  SITE_URL: z.string().url().default("http://localhost:3000"),
  SITE_NAME: z.string().default("MFSTECH-OpenPedia"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  MEILI_HOST: z.string().default("http://localhost:7700"),
  MEILI_MASTER_KEY: z.string().default(""),
  S3_ENDPOINT: z.string().optional(),
  S3_PRESIGN_ENDPOINT: z.string().optional().transform((v) => v || undefined),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().default("wiki-media"),
  S3_ACCESS_KEY_ID: z.string().default(""),
  S3_SECRET_ACCESS_KEY: z.string().default(""),
  S3_FORCE_PATH_STYLE: bool,
  S3_PUBLIC_BASE_URL: z.string().default("http://localhost:9000/wiki-media"),
  MAX_IMAGE_MB: z.coerce.number().default(25),
  MAX_VIDEO_MB: z.coerce.number().default(1024),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;
/** Lazily parsed so that `next build` does not require runtime secrets. */
export function env(): Env {
  return (cached ??= schema.parse(process.env));
}

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

function make(endpoint?: string) {
  const e = env();
  return new S3Client({
    region: e.S3_REGION,
    endpoint,
    forcePathStyle: e.S3_FORCE_PATH_STYLE,
    credentials: { accessKeyId: e.S3_ACCESS_KEY_ID, secretAccessKey: e.S3_SECRET_ACCESS_KEY },
  });
}

let internal: S3Client | undefined;
let presigner: S3Client | undefined;
export const s3 = () => (internal ??= make(env().S3_ENDPOINT));
const signer = () => (presigner ??= make(env().S3_PRESIGN_ENDPOINT ?? env().S3_ENDPOINT));

export const publicUrl = (key: string) => `${env().S3_PUBLIC_BASE_URL}/${key}`;

export async function presignUpload(key: string, contentType: string, contentLength: number) {
  const cmd = new PutObjectCommand({
    Bucket: env().S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  return getSignedUrl(signer(), cmd, { expiresIn: 900 });
}

export async function headObject(key: string) {
  try {
    const r = await s3().send(new HeadObjectCommand({ Bucket: env().S3_BUCKET, Key: key }));
    return { size: Number(r.ContentLength ?? 0), contentType: r.ContentType };
  } catch {
    return null;
  }
}

export async function getObjectStream(key: string) {
  const r = await s3().send(new GetObjectCommand({ Bucket: env().S3_BUCKET, Key: key }));
  return r.Body as NodeJS.ReadableStream;
}

export async function putObject(input: Omit<PutObjectCommandInput, "Bucket">) {
  await s3().send(
    new PutObjectCommand({ CacheControl: "public, max-age=31536000, immutable", ...input, Bucket: env().S3_BUCKET }),
  );
}

export async function deleteObject(key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: env().S3_BUCKET, Key: key }));
}

export async function ensureBucket() {
  const b = env().S3_BUCKET;
  try {
    await s3().send(new CreateBucketCommand({ Bucket: b }));
  } catch (err: unknown) {
    const name = (err as { name?: string })?.name;
    if (name !== "BucketAlreadyOwnedByYou" && name !== "BucketAlreadyExists") {
      // ignore
    }
  }
  const policy = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${b}/*`],
      },
    ],
  });
  await s3().send(new PutBucketPolicyCommand({ Bucket: b, Policy: policy })).catch(() => {});
}

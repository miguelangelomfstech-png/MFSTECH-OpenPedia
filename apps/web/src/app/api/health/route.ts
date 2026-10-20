import { NextResponse } from "next/server";
import { pool } from "@wiki/db";
import { redis } from "@wiki/shared";

export const dynamic = "force-dynamic";

/** Liveness + readiness: used by Docker HEALTHCHECK, Vercel, and uptime monitors. */
export async function GET() {
  const isServerless = !!process.env.VERCEL;
  const hasRemoteRedis =
    !!process.env.REDIS_URL &&
    !process.env.REDIS_URL.includes("localhost") &&
    !process.env.REDIS_URL.includes("127.0.0.1");

  const checks: Record<string, boolean> = {};

  await Promise.all([
    pool().query("select 1").then(
      () => (checks.db = true),
      (err) => {
        console.error("Healthcheck DB error:", err.message);
        checks.db = false;
      }
    ),
    hasRemoteRedis || !isServerless
      ? redis().ping().then(
          () => (checks.redis = true),
          () => (checks.redis = false)
        )
      : Promise.resolve().then(() => {
          checks.redis = true;
        }),
  ]);

  const ok = Object.values(checks).every(Boolean);
  return NextResponse.json({ ok, status: ok ? "ok" : "degraded", checks }, { status: ok ? 200 : 503 });
}

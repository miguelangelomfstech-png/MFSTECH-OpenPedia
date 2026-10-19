import { NextResponse } from "next/server";
import { pool } from "@wiki/db";
import { redis } from "@wiki/shared";

export const dynamic = "force-dynamic";

/** Liveness + readiness: used by Docker HEALTHCHECK, Caddy and uptime monitors. */
export async function GET() {
  const checks: Record<string, boolean> = {};
  await Promise.all([
    pool().query("select 1").then(
      () => (checks.db = true),
      (err) => {
        console.error("Healthcheck DB error:", err.message);
        checks.db = false;
      }
    ),
    redis().ping().then(() => (checks.redis = true), () => (checks.redis = false)),
  ]);
  const ok = Object.values(checks).every(Boolean);
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}

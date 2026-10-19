import path from "node:path";
import type { NextConfig } from "next";
import * as nextEnv from "@next/env";

const loadEnv = nextEnv.loadEnvConfig || (nextEnv as unknown as { default?: { loadEnvConfig?: typeof nextEnv.loadEnvConfig } }).default?.loadEnvConfig;
if (typeof loadEnv === "function") {
  loadEnv(path.resolve(process.cwd(), "../.."));
}

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${process.env.S3_PUBLIC_BASE_URL?.split("/").slice(0, 3).join("/") ?? ""}`,
  `media-src 'self' blob: ${process.env.S3_PUBLIC_BASE_URL?.split("/").slice(0, 3).join("/") ?? ""}`,
  `connect-src 'self' ${(process.env.S3_PRESIGN_ENDPOINT || process.env.S3_ENDPOINT) ?? ""}`,
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  transpilePackages: ["@wiki/db", "@wiki/shared"],
  serverExternalPackages: ["ioredis", "bullmq", "pg", "bcryptjs"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default config;

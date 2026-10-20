import path from "node:path";
import { defineConfig } from "drizzle-kit";

if (typeof process.loadEnvFile === "function") {
  try { process.loadEnvFile(path.resolve(process.cwd(), "../../.env")); } catch {}
  try { process.loadEnvFile(path.resolve(process.cwd(), ".env")); } catch {}
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://wiki:wiki@localhost:5432/wiki" },
});

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

try {
  // Advisory lock so concurrent deploys can't race on migrations.
  await pool.query("select pg_advisory_lock(727274)");
  await migrate(drizzle(pool), { migrationsFolder: path.resolve(here, "../drizzle") });
  await pool.query("select pg_advisory_unlock(727274)");
  console.log("migrations applied");
} catch (e) {
  console.error("migration failed", e);
  process.exitCode = 1;
} finally {
  await pool.end();
}

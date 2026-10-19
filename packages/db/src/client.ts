import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const g = globalThis as unknown as { __pool?: pg.Pool };

export function pool() {
  const connectionString = process.env.DATABASE_URL || "postgres://wiki:wiki@localhost:5432/wiki";
  const needsSsl = connectionString.includes("sslmode=") || (process.env.NODE_ENV === "production" && !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1") && !connectionString.includes("postgres:5432"));
  return (g.__pool ??= new pg.Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  }));
}

let _db: ReturnType<typeof create> | undefined;
function create() {
  return drizzle(pool(), { schema });
}
/** Lazy so importing this module at build time never opens a connection. */
export const db = new Proxy({} as ReturnType<typeof create>, {
  get: (_t, p, r) => Reflect.get((_db ??= create()), p, r),
});

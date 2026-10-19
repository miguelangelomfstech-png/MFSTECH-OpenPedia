import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const g = globalThis as unknown as { __pool?: pg.Pool };

export function pool() {
  return (g.__pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL || "postgres://wiki:wiki@localhost:5432/wiki",
    max: Number(process.env.DB_POOL_MAX ?? 10),
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

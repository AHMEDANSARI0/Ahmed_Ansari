import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is required for the e2e throttle reset helper.");
}

let pool: pg.Pool | null = null;

function getPool() {
  // Worker teardown can close a module level pool mid-suite, so it is created lazily.
  if (!pool) pool = new pg.Pool({ connectionString: url, max: 1 });
  return pool;
}

export async function clearThrottle(identifier: string) {
  await getPool().query("delete from login_attempts where identifier = $1", [identifier.toLowerCase()]);
  await getPool().query("delete from rate_limit_buckets");
}

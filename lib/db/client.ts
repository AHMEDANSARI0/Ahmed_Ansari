import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/db/schema";
import { requireDatabaseUrl } from "@/lib/env";

type Schema = typeof schema;
type Database = NeonDatabase<Schema> & {
  $client: Pool;
};

const globalForDb = globalThis as unknown as { __portfolioDb?: Database };

function isNeonHost(url: string) {
  return url.includes(".neon.tech") || url.includes(".neon.build");
}

function isLocalHost(url: string) {
  return url.includes("127.0.0.1") || url.includes("localhost");
}

function createClient(): Database {
  const url = requireDatabaseUrl();

  if (!isNeonHost(url)) {
    const client = drizzleNode({
      connection: { connectionString: url, max: isLocalHost(url) ? 1 : 10 },
      schema,
      casing: "snake_case",
    });
    return client as unknown as Database;
  }

  if (!neonConfig.wsProxy && typeof WebSocket === "undefined") {
    throw new Error("WebSocket is unavailable in this runtime for the Neon pooled driver.");
  }

  const pool = new Pool({ connectionString: url, max: 5 });
  return drizzleNeon(pool, { schema, casing: "snake_case" }) as unknown as Database;
}

export function getDb(): Database {
  if (!globalForDb.__portfolioDb) {
    globalForDb.__portfolioDb = createClient();
  }
  return globalForDb.__portfolioDb;
}

export { schema };
export type Db = Database;

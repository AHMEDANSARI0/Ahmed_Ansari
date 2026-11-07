import { config } from "dotenv";

config({ path: ".env.local" });

export function databaseUrl() {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL_DIRECT or DATABASE_URL is required.");
    process.exit(1);
  }
  return url;
}

export async function withClient<T>(handler: (client: DbClient) => Promise<T>): Promise<T> {
  const url = databaseUrl();
  const isNeon = url.includes(".neon.tech") || url.includes(".neon.build");

  if (isNeon) {
    const { Pool } = await import("@neondatabase/serverless");
    const pool = new Pool({ connectionString: url, max: 1 });
    try {
      return await handler({
        query: (text, params) => pool.query(text, params).then((r) => r.rows),
        end: () => pool.end(),
      });
    } finally {
      await pool.end().catch(() => undefined);
    }
  }

  const pgModule = await import("pg");
  const pool = new pgModule.default.Pool({ connectionString: url, max: 1 });
  try {
    return await handler({
      query: (text, params) => pool.query(text, params).then((r) => r.rows),
      end: () => pool.end(),
    });
  } finally {
    await pool.end().catch(() => undefined);
  }
}

export type DbClient = {
  query: (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
  end: () => Promise<void>;
};

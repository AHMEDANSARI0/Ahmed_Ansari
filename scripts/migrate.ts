import { config } from "dotenv";
import { Pool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL_DIRECT (or DATABASE_URL) is required to run migrations.");
  process.exit(1);
}

const isNeon = url.includes(".neon.tech") || url.includes(".neon.build");

async function run() {
  if (isNeon) {
    const pool = new Pool({ connectionString: url, max: 1 });
    await migrate(drizzleNeon(pool), { migrationsFolder: "./drizzle" });
    await pool.end();
  } else {
    const { Pool: NodePool } = await import("pg");
    const pool = new NodePool({ connectionString: url, max: 1 });
    await migrate(drizzleNode(pool) as never, { migrationsFolder: "./drizzle" });
    await pool.end();
  }
  console.log("Migrations applied.");
}

run().catch((error) => {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});

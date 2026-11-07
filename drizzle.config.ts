import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL_DIRECT or DATABASE_URL must be set in .env.local");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  casing: "snake_case",
  verbose: true,
  strict: true,
});

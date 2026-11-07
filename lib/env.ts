import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  DATABASE_URL_DIRECT: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  STORAGE_DRIVER: z.enum(["local", "blob"]).default("local"),
  AI_BASE_URL: z.string().url().optional(),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  NOTIFICATION_EMAIL_FROM: z.string().optional(),
  NOTIFICATION_EMAIL_TO: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

type ServerEnv = z.infer<typeof serverSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const normalized = Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, value === "" ? undefined : value]),
  );

  const result = serverSchema.safeParse(normalized);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

export const env = parseServerEnv(process.env);

export const isAiConfigured = Boolean(env.AI_BASE_URL && env.AI_API_KEY && env.AI_MODEL);

export function requireDatabaseUrl(): string {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local before using the database.");
  }
  return env.DATABASE_URL;
}

export function requireSessionSecret(): string {
  if (!env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is not set. Generate one with: openssl rand -base64 48");
  }
  return env.SESSION_SECRET;
}

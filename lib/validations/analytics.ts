import { z } from "zod";

/**
 * A visitor exclusion entry. Only a truncated SHA-256 hash is ever stored, so
 * there is nothing here that could identify a person.
 */
export const excludedVisitorSchema = z.object({
  hash: z
    .string()
    .trim()
    .regex(/^[0-9a-f]{16,32}$/, "Not a valid visitor hash."),
  label: z.string().trim().min(1, "Add a label so you know what was excluded.").max(60),
  createdAt: z.string().datetime(),
  kind: z.enum(["daily", "browser"]),
});

export const analyticsSettingsSchema = z.object({
  excludedVisitors: z
    .array(excludedVisitorSchema)
    .max(50, "At most 50 exclusions. Remove one before adding another."),
});

export type AnalyticsSettingsInput = z.infer<typeof analyticsSettingsSchema>;

/** The browser id is a random UUID generated in the visitor's browser. */
export const browserIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{16,64}$/, "Invalid browser id.");

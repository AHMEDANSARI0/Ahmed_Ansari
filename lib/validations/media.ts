import { z } from "zod";

export const mediaUpdateSchema = z.object({
  id: z.string().uuid(),
  alt: z.string().trim().max(220).optional(),
  fileName: z.string().trim().min(1).max(255).optional(),
});

export const mediaQuerySchema = z.object({
  kind: z.enum(["image", "all", "document"]).default("all"),
  search: z.string().trim().max(80).optional(),
});

export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>;

import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by dashes.");

const urlSchema = z
  .string()
  .trim()
  .max(600)
  .refine((value) => value === "" || /^(\/|https?:\/\/)/.test(value), "Use a full URL or a site path.");

export const projectStageSchema = z.enum(["live", "in-development", "concept", "archived"]);
export const publishStatusSchema = z.enum(["draft", "published", "archived"]);

export const projectFormSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: slugSchema,
  shortDescription: z.string().trim().min(20).max(320),
  fullDescription: z.string().trim().min(40).max(6000),
  problem: z.string().trim().max(4000).optional().or(z.literal("")),
  architecture: z.string().trim().max(4000).optional().or(z.literal("")),
  solution: z.string().trim().max(4000).optional().or(z.literal("")),
  outcome: z.string().trim().max(4000).optional().or(z.literal("")),
  features: z.array(z.string().trim().min(1).max(200)).max(24),
  stage: projectStageSchema,
  status: publishStatusSchema,
  isFeatured: z.boolean(),
  coverImageUrl: urlSchema.optional().or(z.literal("")),
  architectureImageUrl: urlSchema.optional().or(z.literal("")),
  demoUrl: urlSchema.optional().or(z.literal("")),
  repoUrl: urlSchema.optional().or(z.literal("")),
  seoTitle: z.string().trim().max(200).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
  technologyIds: z.array(z.string().uuid()).max(20),
  gallery: z
    .array(
      z.object({
        url: z.string().trim().min(1).max(600),
        alt: z.string().trim().min(1).max(220),
        caption: z.string().trim().max(220).optional().or(z.literal("")),
      }),
    )
    .max(12),
});

export type ProjectFormInput = z.infer<typeof projectFormSchema>;

export const projectStatusUpdateSchema = z.object({
  id: z.string().uuid(),
  status: publishStatusSchema,
});

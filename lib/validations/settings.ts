import { z } from "zod";
import { emailSchema, hexColorSchema } from "@/lib/validations/shared";
import { analyticsSettingsSchema } from "@/lib/validations/analytics";

export const socialLinkSchema = z.object({
  platform: z.enum(["linkedin", "github", "email", "x", "website", "upwork"]),
  label: z.string().trim().min(1).max(60),
  url: z.string().trim().min(3).max(500),
  visible: z.boolean(),
});

export const siteSettingsSchema = z.object({
  siteName: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(120),
  logoText: z.string().trim().min(2).max(24),
  domain: z.string().url(),
  email: emailSchema,
  location: z.string().trim().max(120),
  timezone: z.string().trim().min(3).max(60),
  locale: z.enum(["en", "ur"]),
  copyright: z.string().trim().max(200),
  maintenanceMode: z.boolean(),
  availability: z.object({
    state: z.enum(["available", "limited", "unavailable"]),
    message: z.string().trim().max(200),
    showIndicator: z.boolean(),
  }),
  footer: z.object({
    tagline: z.string().trim().max(200),
    columns: z
      .array(
        z.object({
          title: z.string().trim().max(60),
          links: z.array(
            z.object({
              label: z.string().trim().max(60),
              href: z.string().trim().max(300),
            }),
          ),
        }),
      )
      .max(4),
  }),
  cv: z.object({
    enabled: z.boolean(),
    fileUrl: z.string().nullable(),
    label: z.string().trim().max(60),
  }),
  socialLinks: z.array(socialLinkSchema).max(8),
  // Optional so settings rows written before exclusions existed still parse.
  analytics: analyticsSettingsSchema.optional(),
});

export const designConfigUpdateSchema = z.object({
  colors: z.object({
    background: hexColorSchema,
    surface: hexColorSchema,
    card: hexColorSchema,
    accent: hexColorSchema,
    accentSoft: hexColorSchema,
    text: hexColorSchema,
    textMuted: hexColorSchema,
    border: hexColorSchema,
  }),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

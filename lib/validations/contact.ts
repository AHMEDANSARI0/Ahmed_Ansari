import { z } from "zod";
import { emailSchema } from "@/lib/validations/shared";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: emailSchema,
  company: z.string().trim().max(160).optional().or(z.literal("")),
  projectType: z.string().trim().max(80).optional().or(z.literal("")),
  budgetRange: z.string().trim().max(60).optional().or(z.literal("")),
  timeline: z.string().trim().max(60).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(20, "Describe the project in at least 20 characters.")
    .max(4000, "Keep the description under 4000 characters."),
  website: z.string().max(0, "Rejected.").optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

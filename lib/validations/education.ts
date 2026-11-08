import { z } from "zod";

const year = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "Use a four digit year.")
  .refine((value) => {
    const parsed = Number(value);
    const current = new Date().getFullYear();
    return parsed >= 1950 && parsed <= current + 8;
  }, "That year is outside a sensible range.");

export const educationEntrySchema = z
  .object({
    institution: z.string().trim().min(2, "Enter the institution name.").max(160),
    program: z.string().trim().min(2, "Enter the programme or degree.").max(160),
    location: z.string().trim().max(120).optional().or(z.literal("")),
    startYear: year,
    endYear: year.optional().or(z.literal("")),
    summary: z.string().trim().max(1000).optional().or(z.literal("")),
    isVisible: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.endYear) return; // an empty end year renders as "present"
    if (Number(data.endYear) < Number(data.startYear)) {
      ctx.addIssue({
        code: "custom",
        path: ["endYear"],
        message: "The end year cannot be before the start year.",
      });
    }
  });

export const educationIdSchema = z.string().uuid();

export type EducationFormInput = z.infer<typeof educationEntrySchema>;

import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(5)
  .max(255)
  .email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(200)
  .regex(/\d/, "Include at least one number.")
  .regex(/[^A-Za-z0-9]/, "Include at least one symbol.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(200),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only.");

export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6 digit hex color.");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type LoginInput = z.infer<typeof loginSchema>;

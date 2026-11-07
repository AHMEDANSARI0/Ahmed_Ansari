import { z } from "zod";

export const patternTypeSchema = z.enum([
  "triangular",
  "isometric",
  "diagonal-grid",
  "none",
]);

export const patternConfigSchema = z.object({
  enabled: z.boolean(),
  type: patternTypeSchema,
  triangleSize: z.number().int().min(40).max(320),
  lineThickness: z.number().min(0.4).max(3),
  lineOpacity: z.number().min(0).max(0.6),
  lineColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  highlightIntensity: z.number().min(0).max(1),
  cursorInteraction: z.boolean(),
  cursorRadius: z.number().int().min(60).max(460),
  drift: z.boolean(),
  driftSpeed: z.number().min(0).max(1),
  showOnDesktop: z.boolean(),
  showOnMobile: z.boolean(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export type PatternConfig = z.infer<typeof patternConfigSchema>;
export type PatternType = z.infer<typeof patternTypeSchema>;

export const defaultPatternConfig: PatternConfig = {
  enabled: true,
  type: "triangular",
  triangleSize: 168,
  lineThickness: 1,
  lineOpacity: 0.16,
  lineColor: "#4C6B78",
  accentColor: "#FF9418",
  highlightIntensity: 0.65,
  cursorInteraction: true,
  cursorRadius: 220,
  drift: true,
  driftSpeed: 0.2,
  showOnDesktop: true,
  showOnMobile: true,
  backgroundColor: "#050505",
};

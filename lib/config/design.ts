import { z } from "zod";
import {
  defaultPatternConfig,
  patternConfigSchema,
  type PatternConfig,
} from "@/lib/config/background";

export const designConfigSchema = z.object({
  colors: z.object({
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    surface: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    card: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accentSoft: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    textMuted: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    border: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  typography: z.object({
    headingFont: z.enum(["oxanium", "space-grotesk"]),
    bodyFont: z.enum(["inter"]),
    monoFont: z.enum(["jetbrains-mono"]),
    headingLetterSpacing: z.number().min(-0.05).max(0.1),
    headingWeight: z.number().int().min(400).max(900),
    heroScale: z.number().min(0.7).max(1.6),
  }),
  layout: z.object({
    containerWidth: z.number().int().min(1080).max(1680),
    sectionSpacing: z.number().int().min(64).max(220),
    radius: z.number().int().min(0).max(28),
    borderWidth: z.number().min(0.5).max(3),
    angularCorners: z.boolean(),
    cornerCut: z.number().int().min(0).max(40),
  }),
  buttons: z.object({
    style: z.enum(["solid", "angular", "outline"]),
    uppercase: z.boolean(),
    letterSpacing: z.number().min(0).max(0.3),
  }),
  background: patternConfigSchema,
});

export type DesignConfig = z.infer<typeof designConfigSchema>;

export const defaultDesignConfig: DesignConfig = {
  colors: {
    background: "#050505",
    surface: "#101014",
    card: "#171717",
    accent: "#FF9418",
    accentSoft: "#D97706",
    text: "#F5F5F5",
    textMuted: "#A3A3A3",
    border: "#262626",
  },
  typography: {
    headingFont: "oxanium",
    bodyFont: "inter",
    monoFont: "jetbrains-mono",
    headingLetterSpacing: -0.01,
    headingWeight: 700,
    heroScale: 1,
  },
  layout: {
    containerWidth: 1400,
    sectionSpacing: 128,
    radius: 2,
    borderWidth: 1,
    angularCorners: true,
    cornerCut: 14,
  },
  buttons: {
    style: "angular",
    uppercase: true,
    letterSpacing: 0.08,
  },
  background: defaultPatternConfig,
};

export type { PatternConfig };

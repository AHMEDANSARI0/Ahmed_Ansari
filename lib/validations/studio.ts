import { z } from "zod";
import { hexColorSchema } from "@/lib/validations/shared";
import { SECTION_KEYS, SECTION_ANCHORS } from "@/lib/config/sections";

const anchorSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only.");

export const sectionUpdateSchema = z.object({
  key: z.enum(SECTION_KEYS),
  label: z.string().trim().min(2).max(80),
  navLabel: z.string().trim().max(40).nullable().optional(),
  anchor: anchorSchema,
  eyebrow: z.string().trim().max(80).nullable().optional(),
  heading: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(600).nullable().optional(),
  isVisible: z.boolean(),
  showInNav: z.boolean(),
  animationType: z.string().trim().max(40).nullable().optional(),
});

export const sectionReorderSchema = z.object({
  order: z.array(z.enum(SECTION_KEYS)).min(1),
});

export const sectionContentSchema = z.object({
  key: z.enum(SECTION_KEYS),
  fields: z.record(z.string().max(60), z.unknown()),
});

export const contentFieldValueSchema = z.union([
  z.string().max(4000),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string().max(400)),
  z.array(z.object({ label: z.string().max(120), value: z.string().max(400) })),
  z.array(z.object({ label: z.string().max(120), href: z.string().max(400) })),
]);

export const defaultAnchors = SECTION_ANCHORS;

export const designUpdateSchema = z.object({
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
  typography: z.object({
    headingFont: z.enum(["oxanium", "space-grotesk"]),
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
  background: z.object({
    enabled: z.boolean(),
    type: z.enum(["triangular", "isometric", "diagonal-grid", "none"]),
    triangleSize: z.number().int().min(40).max(320),
    lineThickness: z.number().min(0.4).max(3),
    lineOpacity: z.number().min(0).max(0.6),
    lineColor: hexColorSchema,
    accentColor: hexColorSchema,
    highlightIntensity: z.number().min(0).max(1),
    cursorInteraction: z.boolean(),
    cursorRadius: z.number().int().min(60).max(460),
    drift: z.boolean(),
    driftSpeed: z.number().min(0).max(1),
    showOnDesktop: z.boolean(),
    showOnMobile: z.boolean(),
    backgroundColor: hexColorSchema,
  }),
});

export const animationUpdateSchema = z.object({
  enabled: z.boolean(),
  intensity: z.number().min(0.2).max(1),
  duration: z.number().min(0.2).max(2.4),
  delay: z.number().min(0).max(0.8),
  easing: z.enum(["power2.out", "power3.out", "power4.out", "expo.out", "back.out", "circ.out"]),
  parallaxIntensity: z.number().min(0).max(1),
  magneticButtons: z.boolean(),
  hoverLift: z.boolean(),
  scrollProgressBar: z.boolean(),
  cursorGlow: z.boolean(),
  mobileEnabled: z.boolean(),
  reducedMotionFallback: z.enum(["static", "fade"]),
  sections: z.record(
    z.string(),
    z.enum(["fade-up", "mask-reveal", "word-reveal", "char-reveal", "stagger-grid", "clip-path", "none"]),
  ),
});

const presetSchema = z.object({
  density: z.number().int().min(8).max(48),
  particleSize: z.number().min(0.6).max(3.4),
  color: hexColorSchema,
  accentColor: hexColorSchema,
  accentMix: z.number().min(0).max(1),
  scatterRadius: z.number().int().min(40).max(600),
  assemblyDuration: z.number().min(400).max(4000),
  attractionStrength: z.number().min(0.01).max(0.4),
  interactionRadius: z.number().int().min(40).max(280),
  interactionStrength: z.number().min(0).max(1),
  glow: z.number().min(0).max(1),
  idleMovement: z.number().min(0).max(1),
  brightnessThreshold: z.number().min(0).max(1),
});

export const portraitUpdateSchema = z.object({
  imageUrl: z.string().trim().max(600).nullable(),
  visible: z.boolean(),
  mode: z.enum(["particles", "static"]),
  trigger: z.enum(["load", "scroll", "hover"]),
  desktop: presetSchema,
  mobile: presetSchema,
});

export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>;
export type DesignUpdateInput = z.infer<typeof designUpdateSchema>;
export type AnimationUpdateInput = z.infer<typeof animationUpdateSchema>;
export type PortraitUpdateInput = z.infer<typeof portraitUpdateSchema>;

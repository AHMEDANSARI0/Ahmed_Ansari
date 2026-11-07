import { z } from "zod";

export const easingSchema = z.enum([
  "power2.out",
  "power3.out",
  "power4.out",
  "expo.out",
  "back.out",
  "circ.out",
]);

export const ANIMATION_TYPES = [
  "fade-up",
  "mask-reveal",
  "word-reveal",
  "char-reveal",
  "stagger-grid",
  "clip-path",
  "none",
] as const;

export const animationTypeSchema = z.enum([
  "fade-up",
  "mask-reveal",
  "word-reveal",
  "char-reveal",
  "stagger-grid",
  "clip-path",
  "none",
]);

export const animationConfigSchema = z.object({
  enabled: z.boolean(),
  intensity: z.number().min(0.2).max(1),
  duration: z.number().min(0.2).max(2.4),
  delay: z.number().min(0).max(0.8),
  easing: easingSchema,
  scrollStart: z.number().min(0).max(1),
  parallaxIntensity: z.number().min(0).max(1),
  magneticButtons: z.boolean(),
  hoverLift: z.boolean().default(true),
  scrollProgressBar: z.boolean(),
  cursorGlow: z.boolean(),
  mobileEnabled: z.boolean(),
  reducedMotionFallback: z.enum(["static", "fade"]),
  sections: z.record(z.string(), animationTypeSchema),
});

export type AnimationConfig = z.infer<typeof animationConfigSchema>;
export type AnimationType = z.infer<typeof animationTypeSchema>;

export const defaultAnimationConfig: AnimationConfig = {
  enabled: true,
  intensity: 0.85,
  duration: 0.9,
  delay: 0,
  easing: "power3.out",
  scrollStart: 0.15,
  parallaxIntensity: 0.35,
  magneticButtons: true,
  hoverLift: true,
  scrollProgressBar: true,
  cursorGlow: true,
  mobileEnabled: true,
  reducedMotionFallback: "static",
  sections: {
    hero: "word-reveal",
    about: "mask-reveal",
    expertise: "stagger-grid",
    projects: "clip-path",
    services: "stagger-grid",
    stack: "fade-up",
    process: "stagger-grid",
    contact: "fade-up",
  },
};

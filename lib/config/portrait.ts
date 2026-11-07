import { z } from "zod";

export const particlePresetSchema = z.object({
  density: z.number().int().min(8).max(48),
  particleSize: z.number().min(0.6).max(3.4),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
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

export type ParticlePreset = z.infer<typeof particlePresetSchema>;

export const portraitConfigSchema = z.object({
  imageUrl: z.string().nullable(),
  visible: z.boolean(),
  mode: z.enum(["particles", "static"]),
  trigger: z.enum(["load", "scroll", "hover"]),
  desktop: particlePresetSchema,
  mobile: particlePresetSchema,
});

export type PortraitConfig = z.infer<typeof portraitConfigSchema>;

const desktopPreset: ParticlePreset = {
  density: 26,
  particleSize: 2.4,
  color: "#F2F2F2",
  accentColor: "#FF9418",
  accentMix: 0.14,
  scatterRadius: 240,
  assemblyDuration: 1900,
  attractionStrength: 0.085,
  interactionRadius: 120,
  interactionStrength: 0.55,
  glow: 0.55,
  idleMovement: 0.28,
  brightnessThreshold: 0.3,
};

const mobilePreset: ParticlePreset = {
  ...desktopPreset,
  density: 14,
  particleSize: 2.1,
  scatterRadius: 180,
  assemblyDuration: 1400,
  interactionStrength: 0,
  glow: 0.2,
  idleMovement: 0.2,
};

export const defaultPortraitConfig: PortraitConfig = {
  imageUrl: null,
  visible: true,
  mode: "particles",
  trigger: "load",
  desktop: desktopPreset,
  mobile: mobilePreset,
};

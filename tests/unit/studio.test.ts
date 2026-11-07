import { describe, expect, it } from "vitest";
import {
  animationUpdateSchema,
  designUpdateSchema,
  portraitUpdateSchema,
  sectionUpdateSchema,
} from "@/lib/validations/studio";
import { defaultDesignConfig } from "@/lib/config/design";
import { defaultAnimationConfig } from "@/lib/config/animation";
import { defaultPortraitConfig } from "@/lib/config/portrait";
import { seededRandom } from "@/lib/particles/sampling";

describe("studio payload validation", () => {
  it("accepts the shipped design defaults", () => {
    expect(designUpdateSchema.safeParse(defaultDesignConfig).success).toBe(true);
  });

  it("rejects an invalid hex colour", () => {
    const payload = structuredClone(defaultDesignConfig);
    payload.colors.accent = "orange";
    expect(designUpdateSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects out-of-range slider values", () => {
    const payload = structuredClone(defaultDesignConfig);
    payload.background.triangleSize = 900;
    expect(designUpdateSchema.safeParse(payload).success).toBe(false);

    const motion = structuredClone(defaultAnimationConfig);
    motion.duration = 12;
    expect(animationUpdateSchema.safeParse(motion).success).toBe(false);
  });

  it("accepts the shipped animation and portrait defaults", () => {
    expect(animationUpdateSchema.safeParse(defaultAnimationConfig).success).toBe(true);
    expect(portraitUpdateSchema.safeParse(defaultPortraitConfig).success).toBe(true);
  });

  it("rejects a portrait mode outside the allow list", () => {
    const payload = structuredClone(defaultPortraitConfig) as Record<string, unknown>;
    payload.mode = "hologram";
    expect(portraitUpdateSchema.safeParse(payload).success).toBe(false);
  });

  it("normalises section anchors and rejects unsafe ones", () => {
    const base = {
      key: "projects",
      label: "Projects",
      anchor: "work",
      isVisible: true,
      showInNav: true,
    };

    expect(sectionUpdateSchema.safeParse(base).success).toBe(true);
    expect(sectionUpdateSchema.safeParse({ ...base, anchor: "Work Page" }).success).toBe(false);
    expect(sectionUpdateSchema.safeParse({ ...base, key: "footer" }).success).toBe(false);
  });
});

describe("particle sampling", () => {
  it("produces a deterministic sequence for a seed", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    const values = [a(), a(), a()];
    expect(values).toEqual([b(), b(), b()]);
  });

  it("stays inside the 0..1 range", () => {
    const random = seededRandom(7);
    for (let i = 0; i < 500; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

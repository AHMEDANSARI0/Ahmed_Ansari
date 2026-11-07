import { describe, expect, it } from "vitest";
import { designConfigSchema, defaultDesignConfig } from "@/lib/config/design";
import { animationConfigSchema, defaultAnimationConfig } from "@/lib/config/animation";
import { portraitConfigSchema, defaultPortraitConfig } from "@/lib/config/portrait";
import { patternConfigSchema, defaultPatternConfig } from "@/lib/config/background";

describe("configuration defaults", () => {
  it("design defaults satisfy their own schema", () => {
    expect(designConfigSchema.safeParse(defaultDesignConfig).success).toBe(true);
  });

  it("animation defaults satisfy their own schema", () => {
    expect(animationConfigSchema.safeParse(defaultAnimationConfig).success).toBe(true);
  });

  it("portrait defaults satisfy their own schema", () => {
    expect(portraitConfigSchema.safeParse(defaultPortraitConfig).success).toBe(true);
  });

  it("pattern defaults satisfy their own schema", () => {
    expect(patternConfigSchema.safeParse(defaultPatternConfig).success).toBe(true);
  });

  it("rejects invalid hex colors", () => {
    const result = designConfigSchema.safeParse({
      ...defaultDesignConfig,
      colors: { ...defaultDesignConfig.colors, accent: "orange" },
    });
    expect(result.success).toBe(false);
  });

  it("clamps out of range slider values", () => {
    const result = animationConfigSchema.safeParse({
      ...defaultAnimationConfig,
      intensity: 4,
    });
    expect(result.success).toBe(false);
  });
});

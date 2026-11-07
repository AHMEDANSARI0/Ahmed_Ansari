import { describe, expect, it } from "vitest";
import {
  extensionFor,
  isAllowedMime,
  matchesSignature,
  safeKey,
  MAX_UPLOAD_BYTES,
} from "@/lib/storage/types";
import { projectFormSchema } from "@/lib/validations/project";
import { mediaUpdateSchema } from "@/lib/validations/media";

const validProject = {
  title: "OmniFlow",
  slug: "omniflow",
  shortDescription: "AI-powered business automation platform for routing requests.",
  fullDescription: "A single intake layer that classifies, enriches and routes every request.",
  problem: "",
  architecture: "",
  solution: "",
  outcome: "",
  features: ["Workflow definitions"],
  stage: "in-development" as const,
  status: "draft" as const,
  isFeatured: false,
  coverImageUrl: "",
  architectureImageUrl: "",
  demoUrl: "",
  repoUrl: "",
  seoTitle: "",
  seoDescription: "",
  technologyIds: [],
  gallery: [],
};

describe("upload guards", () => {
  it("accepts only the documented mime types", () => {
    expect(isAllowedMime("image/png")).toBe(true);
    expect(isAllowedMime("image/svg+xml")).toBe(false);
    expect(isAllowedMime("application/x-msdownload")).toBe(false);
  });

  it("maps mime types to extensions", () => {
    expect(extensionFor("image/jpeg")).toBe("jpg");
    expect(extensionFor("application/pdf")).toBe("pdf");
    expect(extensionFor("text/html")).toBeNull();
  });

  it("detects magic byte mismatches", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const pdf = Buffer.from("%PDF-1.7", "ascii");

    expect(matchesSignature(png, "image/png")).toBe(true);
    expect(matchesSignature(jpeg, "image/jpeg")).toBe(true);
    expect(matchesSignature(pdf, "application/pdf")).toBe(true);
    expect(matchesSignature(png, "image/jpeg")).toBe(false);
    expect(matchesSignature(Buffer.from("<html>"), "image/png")).toBe(false);
  });

  it("sanitises file names and keeps them unique", () => {
    const key = safeKey("My Portrait (final)!!.PNG");
    expect(key).toMatch(/^[a-z0-9]+-[a-z0-9.-]+$/);
    expect(key).not.toContain(" ");
    expect(key.endsWith(".png")).toBe(true);
    expect(safeKey("photo.jpg")).not.toBe(safeKey("photo.jpg"));
  });

  it("documents the size ceiling", () => {
    expect(MAX_UPLOAD_BYTES).toBe(8 * 1024 * 1024);
  });
});

describe("project payload validation", () => {
  it("accepts a minimal valid project", () => {
    expect(projectFormSchema.safeParse(validProject).success).toBe(true);
  });

  it("rejects an invalid slug", () => {
    expect(projectFormSchema.safeParse({ ...validProject, slug: "Omni Flow" }).success).toBe(false);
    expect(projectFormSchema.safeParse({ ...validProject, slug: "-leading" }).success).toBe(false);
  });

  it("rejects a short summary", () => {
    expect(projectFormSchema.safeParse({ ...validProject, shortDescription: "too short" }).success).toBe(
      false,
    );
  });

  it("rejects unsafe links", () => {
    expect(projectFormSchema.safeParse({ ...validProject, demoUrl: "javascript:alert(1)" }).success).toBe(
      false,
    );
    expect(projectFormSchema.safeParse({ ...validProject, demoUrl: "/work/other" }).success).toBe(true);
  });

  it("caps gallery entries", () => {
    const gallery = Array.from({ length: 13 }, () => ({ url: "/a.png", alt: "a", caption: "" }));
    expect(projectFormSchema.safeParse({ ...validProject, gallery }).success).toBe(false);
  });
});

describe("media metadata validation", () => {
  it("requires a uuid", () => {
    expect(mediaUpdateSchema.safeParse({ id: "nope", alt: "a" }).success).toBe(false);
    expect(
      mediaUpdateSchema.safeParse({ id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301", alt: "a" }).success,
    ).toBe(true);
  });
});

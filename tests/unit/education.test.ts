import { describe, expect, it } from "vitest";
import { educationEntrySchema } from "@/lib/validations/education";

const valid = {
  institution: "University of Karachi",
  program: "BS Computer Science",
  location: "Karachi, Pakistan",
  startYear: "2019",
  endYear: "2023",
  summary: "",
  isVisible: true,
};

function parse(overrides: Record<string, unknown>) {
  return educationEntrySchema.safeParse({ ...valid, ...overrides });
}

describe("education entry", () => {
  it("accepts a complete entry", () => {
    expect(parse({}).success).toBe(true);
  });

  it("accepts an empty end year, which renders as present", () => {
    const result = parse({ endYear: "" });
    expect(result.success).toBe(true);
  });

  it("rejects an end year before the start year", () => {
    const result = parse({ startYear: "2021", endYear: "2019" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["endYear"]);
      expect(result.error.issues[0]?.message).toMatch(/cannot be before/i);
    }
  });

  it("accepts the same start and end year", () => {
    expect(parse({ startYear: "2021", endYear: "2021" }).success).toBe(true);
  });

  it.each(["19", "abcd", "20199"])("rejects %s as a year", (value) => {
    expect(parse({ startYear: value }).success).toBe(false);
  });

  it("requires an institution and a programme", () => {
    expect(parse({ institution: "" }).success).toBe(false);
    expect(parse({ program: "" }).success).toBe(false);
  });

  it("has no default value that could pose as a real credential", () => {
    // The seed is empty by design; nothing here should ever be pre-filled for a person.
    const result = educationEntrySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

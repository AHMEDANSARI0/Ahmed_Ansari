import { describe, expect, it } from "vitest";
import { PERMISSIONS, can, permissionsForRole } from "@/lib/permissions";

describe("role permissions", () => {
  it("gives the owner every permission", () => {
    expect(permissionsForRole("owner")).toHaveLength(Object.keys(PERMISSIONS).length);
  });

  it("prevents editors from managing settings and users", () => {
    expect(can("editor", PERMISSIONS.contentEdit)).toBe(true);
    expect(can("editor", PERMISSIONS.settingsManage)).toBe(false);
    expect(can("editor", PERMISSIONS.usersManage)).toBe(false);
  });

  it("keeps viewers read only", () => {
    expect(can("viewer", PERMISSIONS.dashboardView)).toBe(true);
    expect(can("viewer", PERMISSIONS.contentEdit)).toBe(false);
    expect(can("viewer", PERMISSIONS.inquiriesManage)).toBe(false);
  });
});

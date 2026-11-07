export const PERMISSIONS = {
  dashboardView: "dashboard.view",
  contentEdit: "content.edit",
  contentPublish: "content.publish",
  projectsManage: "projects.manage",
  mediaManage: "media.manage",
  inquiriesView: "inquiries.view",
  inquiriesManage: "inquiries.manage",
  analyticsView: "analytics.view",
  settingsManage: "settings.manage",
  usersManage: "users.manage",
  backupManage: "backup.manage",
  auditView: "audit.view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type RoleKey = "owner" | "editor" | "viewer";

const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  owner: Object.values(PERMISSIONS),
  editor: [
    PERMISSIONS.dashboardView,
    PERMISSIONS.contentEdit,
    PERMISSIONS.projectsManage,
    PERMISSIONS.mediaManage,
    PERMISSIONS.inquiriesView,
    PERMISSIONS.inquiriesManage,
    PERMISSIONS.analyticsView,
  ],
  viewer: [
    PERMISSIONS.dashboardView,
    PERMISSIONS.inquiriesView,
    PERMISSIONS.analyticsView,
  ],
};

export function permissionsForRole(role: RoleKey): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function can(role: RoleKey, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

import {
  Activity,
  Brush,
  ChartNoAxesColumn,
  DatabaseBackup,
  FolderKanban,
  GraduationCap,
  Images,
  CircleUser,
  Inbox,
  LayoutDashboard,
  Layers,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PERMISSIONS, type Permission } from "@/lib/permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const adminNavigation: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        permission: PERMISSIONS.dashboardView,
      },
      {
        label: "Inquiries",
        href: "/admin/inquiries",
        icon: Inbox,
        permission: PERMISSIONS.inquiriesView,
      },
      {
        label: "Analytics",
        href: "/admin/analytics",
        icon: ChartNoAxesColumn,
        permission: PERMISSIONS.analyticsView,
      },
      {
        label: "Activity",
        href: "/admin/activity",
        icon: Activity,
        permission: PERMISSIONS.auditView,
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        label: "Projects",
        href: "/admin/projects",
        icon: FolderKanban,
        permission: PERMISSIONS.projectsManage,
      },
      {
        label: "Media",
        href: "/admin/media",
        icon: Images,
        permission: PERMISSIONS.mediaManage,
      },
      {
        label: "Education",
        href: "/admin/education",
        icon: GraduationCap,
        permission: PERMISSIONS.contentEdit,
      },
    ],
  },
  {
    label: "Studios",
    items: [
      {
        label: "Sections",
        href: "/admin/studio/sections",
        icon: Layers,
        permission: PERMISSIONS.contentEdit,
      },
      {
        label: "Design",
        href: "/admin/studio/design",
        icon: Brush,
        permission: PERMISSIONS.settingsManage,
      },
      {
        label: "Animation",
        href: "/admin/studio/animation",
        icon: Sparkles,
        permission: PERMISSIONS.settingsManage,
      },
      {
        label: "Portrait",
        href: "/admin/studio/portrait",
        icon: UserRoundSearch,
        permission: PERMISSIONS.settingsManage,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Account",
        href: "/admin/account",
        icon: CircleUser,
        permission: PERMISSIONS.dashboardView,
      },
      {
        label: "Security",
        href: "/admin/security",
        icon: ShieldCheck,
        permission: PERMISSIONS.usersManage,
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        permission: PERMISSIONS.settingsManage,
      },
      {
        label: "SEO",
        href: "/admin/seo",
        icon: Search,
        permission: PERMISSIONS.settingsManage,
      },
      {
        label: "Backups",
        href: "/admin/backups",
        icon: DatabaseBackup,
        permission: PERMISSIONS.backupManage,
      },
    ],
  },
];

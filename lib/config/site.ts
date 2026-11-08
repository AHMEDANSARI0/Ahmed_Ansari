export const SITE_DEFAULTS = {
  name: "Ahmed Ansari",
  role: "AI Automation Engineer",
  logoText: "AHMED",
  // Canonical identity. The deployment host is the source of truth until a custom
  // domain is attached; the mail address is a real mailbox, not a placeholder.
  domain: "https://ahmedansari.vercel.app",
  email: "ahmedehtesham15@gmail.com",
  location: "Karachi, Pakistan",
  timezone: "Asia/Karachi",
  locale: "en" as const,
  copyright: `© ${new Date().getFullYear()} Ahmed Ansari. All rights reserved.`,
  maintenanceMode: false,
} as const;

export type AvailabilityState = "available" | "limited" | "unavailable";

export const AVAILABILITY_LABELS: Record<AvailabilityState, string> = {
  available: "Available for projects",
  limited: "Limited availability",
  unavailable: "Not accepting projects",
};

export type SocialPlatform =
  | "linkedin"
  | "github"
  | "email"
  | "x"
  | "website"
  | "upwork";

export type SocialLinkValue = {
  platform: SocialPlatform;
  label: string;
  url: string;
  visible: boolean;
};

/**
 * A visitor that should never be counted. Only hashes are stored: the daily
 * rotating visitor hash and a stable hash of the browser id. No IP, no cookie.
 */
export type ExcludedVisitor = {
  hash: string;
  label: string;
  createdAt: string;
  kind: "daily" | "browser";
};

export type AnalyticsSettingsValue = {
  excludedVisitors: ExcludedVisitor[];
};

export type SiteSettingsValue = {
  siteName: string;
  role: string;
  logoText: string;
  domain: string;
  email: string;
  location: string;
  timezone: string;
  locale: "en" | "ur";
  copyright: string;
  maintenanceMode: boolean;
  availability: {
    state: AvailabilityState;
    message: string;
    showIndicator: boolean;
  };
  socialLinks: SocialLinkValue[];
  footer: {
    tagline: string;
    columns: { title: string; links: { label: string; href: string }[] }[];
  };
  cv: {
    enabled: boolean;
    fileUrl: string | null;
    label: string;
  };
  analytics: AnalyticsSettingsValue;
};

export const defaultAnalyticsSettings: AnalyticsSettingsValue = {
  excludedVisitors: [],
};

export const defaultSiteSettings: SiteSettingsValue = {
  siteName: SITE_DEFAULTS.name,
  role: SITE_DEFAULTS.role,
  logoText: SITE_DEFAULTS.logoText,
  domain: SITE_DEFAULTS.domain,
  email: SITE_DEFAULTS.email,
  location: SITE_DEFAULTS.location,
  timezone: SITE_DEFAULTS.timezone,
  locale: SITE_DEFAULTS.locale,
  copyright: SITE_DEFAULTS.copyright,
  maintenanceMode: false,
  availability: {
    state: "available",
    message: "Accepting new automation projects",
    showIndicator: true,
  },
  socialLinks: [
    {
      platform: "linkedin",
      label: "LinkedIn",
      url: "https://linkedin.com/in/ahmedansari15",
      visible: true,
    },
    {
      platform: "github",
      label: "GitHub",
      url: "https://github.com/AHMEDANSARI0",
      visible: true,
    },
    {
      platform: "email",
      label: "Email",
      url: "mailto:ahmedehtesham15@gmail.com",
      visible: true,
    },
  ],
  footer: {
    tagline: "Intelligent systems for businesses that refuse to stay manual.",
    columns: [],
  },
  cv: {
    enabled: false,
    fileUrl: null,
    label: "Download CV",
  },
  analytics: defaultAnalyticsSettings,
};

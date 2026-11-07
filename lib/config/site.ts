export const SITE_DEFAULTS = {
  name: "Ahmed Ansari",
  role: "AI Automation Engineer",
  logoText: "AHMED",
  domain: "https://ahmedansari.dev",
  email: "hello@ahmedansari.dev",
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
    message: "Accepting new automation projects for Q1",
    showIndicator: true,
  },
  socialLinks: [
    {
      platform: "linkedin",
      label: "LinkedIn",
      url: "https://linkedin.com/in/ahmedansari",
      visible: true,
    },
    {
      platform: "github",
      label: "GitHub",
      url: "https://github.com/ahmedansari",
      visible: true,
    },
    { platform: "email", label: "Email", url: "mailto:hello@ahmedansari.dev", visible: true },
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
};

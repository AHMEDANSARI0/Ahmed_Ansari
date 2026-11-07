export const SECTION_KEYS = [
  "hero",
  "about",
  "expertise",
  "projects",
  "services",
  "stack",
  "process",
  "contact",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_ANCHORS: Record<SectionKey, string> = {
  hero: "home",
  about: "about",
  expertise: "expertise",
  projects: "work",
  services: "services",
  stack: "stack",
  process: "process",
  contact: "contact",
};

export type HeroContent = {
  eyebrow: string;
  heading: string;
  highlightWords: string[];
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  hudLabels: { label: string; value: string }[];
  scrollLabel: string;
};

export type AboutContent = {
  philosophy: string;
  highlights: string[];
  stats: { label: string; value: string }[];
};

export type ContactContent = {
  responseTime: string;
  projectTypes: string[];
  budgetRanges: string[];
  timelines: string[];
};

export const defaultHeroContent: HeroContent = {
  eyebrow: "AI Automation Engineer",
  heading: "Building intelligence.\nAutomating the future.",
  highlightWords: ["intelligence.", "future."],
  description:
    "I build intelligent AI agents, automation systems, and scalable digital solutions that help businesses eliminate repetitive work and operate smarter.",
  primaryCta: { label: "Explore my work", href: "#work" },
  secondaryCta: { label: "Let's build something", href: "#contact" },
  hudLabels: [
    { label: "SYSTEM", value: "ONLINE" },
    { label: "STACK", value: "AGENTS / RPA / API" },
    { label: "BASE", value: "KARACHI, PK" },
  ],
  scrollLabel: "Scroll to explore",
};

export const defaultAboutContent: AboutContent = {
  philosophy:
    "Automation should be boring in the best way: predictable, observable, and easy to hand over. If a workflow cannot be explained to the person running it, it is not finished.",
  highlights: [
    "Agent workflows with human checkpoints",
    "Workflow automation across existing SaaS tools",
    "APIs and data layers that stay maintainable",
  ],
  stats: [],
};

export const defaultContactContent: ContactContent = {
  responseTime: "Usually replies within 24 hours",
  projectTypes: ["AI agent", "Business automation", "API integration", "Custom software", "Not sure yet"],
  budgetRanges: ["Under $1k", "$1k - $3k", "$3k - $8k", "$8k+", "Prefer to discuss"],
  timelines: ["ASAP", "2-4 weeks", "1-2 months", "Flexible"],
};

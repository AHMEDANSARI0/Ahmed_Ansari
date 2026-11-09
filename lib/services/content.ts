import { unstable_cache } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  education,
  projectTechnologies,
  projects,
  sectionContent,
  sections,
  services,
  skillCategories,
  skills,
  technologies,
} from "@/lib/db/schema";
import { CONFIG_TAGS } from "@/lib/services/settings";
import {
  defaultAboutContent,
  defaultContactContent,
  defaultHeroContent,
  type AboutContent,
  type ContactContent,
  type HeroContent,
  type SectionKey,
  SECTION_ANCHORS,
} from "@/lib/config/sections";
import { ANIMATION_TYPES, type AnimationType } from "@/lib/config/animation";
import { hasDatabase } from "@/lib/rsc-guard";

const REVIEW_MARKER = /\s*\[REVIEW\]/g;

export function publicText(value: string | null | undefined) {
  if (!value) return value ?? null;
  return value.replace(REVIEW_MARKER, "").trim();
}

export type SectionRecord = {
  key: string;
  label: string;
  anchor: string;
  eyebrow: string | null;
  heading: string | null;
  description: string | null;
  isVisible: boolean;
  showInNav: boolean;
  navLabel: string | null;
  animationType: string | null;
  content: Record<string, unknown>;
};

export type ProcessStep = { step: string; title: string; description: string };

export function withSectionAnimations(
  animation: import("@/lib/config/animation").AnimationConfig,
  sections: SectionRecord[],
) {
  const merged: Record<string, AnimationType> = { ...animation.sections };
  for (const section of sections) {
    if (!section.animationType) continue;
    if (ANIMATION_TYPES.includes(section.animationType as AnimationType)) {
      merged[section.key] = section.animationType as AnimationType;
    }
  }
  return { ...animation, sections: merged };
}

async function loadSections(): Promise<SectionRecord[]> {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(sections)
      .orderBy(asc(sections.position));

    const contentRows = await db.select().from(sectionContent);

    return rows.map((row) => ({
      key: row.key,
      label: row.label,
      anchor: row.anchor || SECTION_ANCHORS[row.key as SectionKey] || row.key,
      eyebrow: publicText(row.eyebrow),
      heading: publicText(row.heading),
      description: publicText(row.description),
      isVisible: row.isVisible,
      showInNav: row.showInNav,
      navLabel: row.navLabel,
      animationType: row.animationType,
      content: Object.fromEntries(
        contentRows
          .filter((entry) => entry.sectionId === row.id)
          .map((entry) => [entry.fieldKey, entry.value]),
      ),
    }));
  } catch {
    return [];
  }
}

export const getSections = unstable_cache(loadSections, ["sections"], {
  tags: [CONFIG_TAGS.sections],
  revalidate: 300,
});

export function sectionByKey(list: SectionRecord[], key: SectionKey) {
  return list.find((section) => section.key === key);
}

export function visibleSections(list: SectionRecord[]) {
  return list.filter((section) => section.isVisible);
}

export function navSections(list: SectionRecord[]) {
  return list.filter((section) => section.isVisible && section.showInNav);
}

export function parseHero(section: SectionRecord | undefined): HeroContent {
  if (!section) return defaultHeroContent;
  const content = section.content as Partial<HeroContent>;
  return {
    eyebrow: section.eyebrow ?? defaultHeroContent.eyebrow,
    heading: section.heading ?? defaultHeroContent.heading,
    highlightWords: defaultHeroContent.highlightWords,
    description: section.description ?? defaultHeroContent.description,
    primaryCta: content.primaryCta ?? defaultHeroContent.primaryCta,
    secondaryCta: content.secondaryCta ?? defaultHeroContent.secondaryCta,
    hudLabels: content.hudLabels ?? defaultHeroContent.hudLabels,
    scrollLabel: content.scrollLabel ?? defaultHeroContent.scrollLabel,
  };
}

export function parseAbout(section: SectionRecord | undefined): AboutContent {
  if (!section) return defaultAboutContent;
  const content = section.content as Partial<AboutContent>;
  return {
    philosophy: content.philosophy ?? defaultAboutContent.philosophy,
    highlights: content.highlights ?? defaultAboutContent.highlights,
    stats: content.stats ?? [],
  };
}

export function parseContact(section: SectionRecord | undefined): ContactContent {
  if (!section) return defaultContactContent;
  const content = section.content as Partial<ContactContent>;
  return {
    responseTime: content.responseTime ?? defaultContactContent.responseTime,
    projectTypes: content.projectTypes ?? defaultContactContent.projectTypes,
    budgetRanges: content.budgetRanges ?? defaultContactContent.budgetRanges,
    timelines: content.timelines ?? defaultContactContent.timelines,
  };
}

export function parseProcess(section: SectionRecord | undefined): ProcessStep[] {
  const steps = section?.content.steps;
  return Array.isArray(steps) ? (steps as ProcessStep[]) : [];
}

export type ProjectCard = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  coverImageUrl: string | null;
  stage: string;
  isFeatured: boolean;
  position: number;
  technologies: string[];
};

async function loadProjects(): Promise<ProjectCard[]> {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: projects.id,
        slug: projects.slug,
        title: projects.title,
        shortDescription: projects.shortDescription,
        coverImageUrl: projects.coverImageUrl,
        stage: projects.stage,
        isFeatured: projects.isFeatured,
        position: projects.position,
      })
      .from(projects)
      .where(eq(projects.status, "published"))
      .orderBy(asc(projects.position));

    const links = await db
      .select({
        projectId: projectTechnologies.projectId,
        name: technologies.name,
      })
      .from(projectTechnologies)
      .innerJoin(technologies, eq(technologies.id, projectTechnologies.technologyId))
      .orderBy(asc(technologies.position));

    return rows.map((row) => ({
      ...row,
      technologies: links
        .filter((link) => link.projectId === row.id)
        .map((link) => link.name),
    }));
  } catch {
    return [];
  }
}

export const getProjectCards = unstable_cache(loadProjects, ["project-cards"], {
  tags: [CONFIG_TAGS.content],
  revalidate: 300,
});

export type EducationItem = {
  id: string;
  institution: string;
  program: string;
  location: string | null;
  startYear: string;
  endYear: string | null;
  summary: string | null;
};

async function loadEducation(): Promise<EducationItem[]> {
  if (!hasDatabase()) return [];
  try {
    const rows = await getDb()
      .select()
      .from(education)
      .where(eq(education.isVisible, true))
      .orderBy(asc(education.position), asc(education.startYear));

    // A placeholder that never got replaced is worse than no block at all.
    return rows
      .map((row) => ({
        id: row.id,
        institution: publicText(row.institution) ?? "",
        program: publicText(row.program) ?? "",
        location: row.location,
        startYear: row.startYear,
        endYear: row.endYear,
        summary: publicText(row.summary),
      }))
      .filter((row) => row.institution.length > 0 && row.program.length > 0);
  } catch {
    return [];
  }
}

export const getEducation = unstable_cache(loadEducation, ["education"], {
  tags: [CONFIG_TAGS.content],
  revalidate: 300,
});

async function loadExpertise() {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    const categories = await db
      .select()
      .from(skillCategories)
      .where(eq(skillCategories.isVisible, true))
      .orderBy(asc(skillCategories.position));

    const allSkills = await db.select().from(skills).orderBy(asc(skills.position));

    return categories.map((category) => ({
      id: category.id,
      key: category.key,
      title: category.title,
      description: category.description,
      icon: category.icon,
      items: allSkills
        .filter((skill) => skill.categoryId === category.id)
        .map((skill) => skill.label),
    }));
  } catch {
    return [];
  }
}

export const getExpertise = unstable_cache(loadExpertise, ["expertise"], {
  tags: [CONFIG_TAGS.content],
  revalidate: 300,
});

async function loadServices() {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(services)
      .where(eq(services.isVisible, true))
      .orderBy(asc(services.position));
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      deliverables: (row.deliverables as string[]) ?? [],
      icon: row.icon,
      ctaLabel: row.ctaLabel,
      ctaHref: row.ctaHref,
      priceLabel: row.showPrice ? row.priceLabel : null,
    }));
  } catch {
    return [];
  }
}

export const getServices = unstable_cache(loadServices, ["services"], {
  tags: [CONFIG_TAGS.content],
  revalidate: 300,
});

async function loadStack() {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    const [techRows, categories] = await Promise.all([
      db
        .select()
        .from(technologies)
        .where(eq(technologies.isVisible, true))
        .orderBy(asc(technologies.position)),
      db.select().from(skillCategories).orderBy(asc(skillCategories.position)),
    ]);

    return techRows.map((tech) => ({
      id: tech.id,
      name: tech.name,
      description: tech.description,
      websiteUrl: tech.websiteUrl,
      isFeatured: tech.isFeatured,
      category: categories.find((category) => category.id === tech.categoryId)?.title ?? "Other",
    }));
  } catch {
    return [];
  }
}

export const getStack = unstable_cache(loadStack, ["stack"], {
  tags: [CONFIG_TAGS.content],
  revalidate: 300,
});

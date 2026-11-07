import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { sectionContent, sections } from "@/lib/db/schema";
import { hasDatabase } from "@/lib/rsc-guard";
import { SECTION_ANCHORS, SECTION_KEYS, type SectionKey } from "@/lib/config/sections";

export type StudioSection = {
  id: string;
  key: SectionKey;
  label: string;
  navLabel: string | null;
  anchor: string;
  eyebrow: string | null;
  heading: string | null;
  description: string | null;
  position: number;
  isVisible: boolean;
  showInNav: boolean;
  animationType: string | null;
  fields: Record<string, unknown>;
};

export async function getStudioSections(): Promise<StudioSection[]> {
  if (!hasDatabase()) {
    return SECTION_KEYS.map((key, index) => ({
      id: key,
      key,
      label: key,
      navLabel: null,
      anchor: SECTION_ANCHORS[key],
      eyebrow: null,
      heading: null,
      description: null,
      position: index,
      isVisible: true,
      showInNav: true,
      animationType: null,
      fields: {},
    }));
  }

  const db = getDb();
  const rows = await db.select().from(sections).orderBy(asc(sections.position));
  const content = await db.select().from(sectionContent);

  return rows.map((row) => ({
    id: row.id,
    key: row.key as SectionKey,
    label: row.label,
    navLabel: row.navLabel,
    anchor: row.anchor,
    eyebrow: row.eyebrow,
    heading: row.heading,
    description: row.description,
    position: row.position,
    isVisible: row.isVisible,
    showInNav: row.showInNav,
    animationType: row.animationType,
    fields: Object.fromEntries(
      content.filter((entry) => entry.sectionId === row.id).map((entry) => [entry.fieldKey, entry.value]),
    ),
  }));
}

export async function getStudioSection(key: SectionKey): Promise<StudioSection | null> {
  const all = await getStudioSections();
  return all.find((section) => section.key === key) ?? null;
}

export async function getSectionFieldKeys(key: SectionKey) {
  if (!hasDatabase()) return [];
  const db = getDb();
  const [section] = await db.select({ id: sections.id }).from(sections).where(eq(sections.key, key)).limit(1);
  if (!section) return [];
  const rows = await db.select().from(sectionContent).where(eq(sectionContent.sectionId, section.id));
  return rows.map((row) => row.fieldKey);
}

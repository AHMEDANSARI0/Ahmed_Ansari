import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { education } from "@/lib/db/schema";
import { hasDatabase } from "@/lib/rsc-guard";

export type EducationRecord = {
  id: string;
  institution: string;
  program: string;
  location: string | null;
  startYear: string;
  endYear: string | null;
  summary: string | null;
  isVisible: boolean;
  position: number;
};

export async function listEducation(): Promise<EducationRecord[]> {
  if (!hasDatabase()) return [];
  try {
    const rows = await getDb()
      .select()
      .from(education)
      .orderBy(asc(education.position), asc(education.startYear));

    return rows.map((row) => ({
      id: row.id,
      institution: row.institution,
      program: row.program,
      location: row.location,
      startYear: row.startYear,
      endYear: row.endYear,
      summary: row.summary,
      isVisible: row.isVisible,
      position: row.position,
    }));
  } catch {
    return [];
  }
}

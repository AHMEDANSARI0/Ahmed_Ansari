import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { contactInquiries, inquiryNotes } from "@/lib/db/schema";
import { hasDatabase } from "@/lib/rsc-guard";

export type InquiryFilter = {
  status?: "new" | "contacted" | "qualified" | "converted" | "archived";
  query?: string;
};

export async function listInquiries(filter: InquiryFilter = {}) {
  if (!hasDatabase()) return { items: [], total: 0 };

  try {
    const db = getDb();
    const conditions = [];

    if (filter.status) conditions.push(eq(contactInquiries.status, filter.status));
    if (filter.query) {
      const term = `%${filter.query}%`;
      conditions.push(
        or(
          ilike(contactInquiries.name, term),
          ilike(contactInquiries.email, term),
          ilike(contactInquiries.company, term),
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db
      .select({
        id: contactInquiries.id,
        name: contactInquiries.name,
        email: contactInquiries.email,
        company: contactInquiries.company,
        projectType: contactInquiries.projectType,
        budgetRange: contactInquiries.budgetRange,
        message: contactInquiries.message,
        status: contactInquiries.status,
        isRead: contactInquiries.isRead,
        createdAt: contactInquiries.createdAt,
      })
      .from(contactInquiries)
      .where(where)
      .orderBy(desc(contactInquiries.createdAt))
      .limit(100);

    const [count] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(contactInquiries)
      .where(where);

    return { items, total: count?.total ?? 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export type InquiryDetail = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  projectType: string | null;
  budgetRange: string | null;
  timeline: string | null;
  message: string;
  status: string;
  isRead: boolean;
  createdAt: Date;
  notes: { id: string; body: string; createdAt: Date }[];
};

export async function getInquiry(id: string): Promise<InquiryDetail | null> {
  if (!hasDatabase()) return null;

  const db = getDb();
  const [row] = await db.select().from(contactInquiries).where(eq(contactInquiries.id, id)).limit(1);
  if (!row) return null;

  const notes = await db
    .select({ id: inquiryNotes.id, body: inquiryNotes.body, createdAt: inquiryNotes.createdAt })
    .from(inquiryNotes)
    .where(eq(inquiryNotes.inquiryId, id))
    .orderBy(desc(inquiryNotes.createdAt));

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    projectType: row.projectType,
    budgetRange: row.budgetRange,
    timeline: row.timeline,
    message: row.message,
    status: row.status,
    isRead: row.isRead,
    createdAt: row.createdAt,
    notes,
  };
}

export async function countUnreadInquiries() {
  if (!hasDatabase()) return 0;
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contactInquiries)
    .where(eq(contactInquiries.isRead, false));
  return row?.count ?? 0;
}

export async function listInquiryDetails(filter: InquiryFilter = {}) {
  if (!hasDatabase()) return { items: [], total: 0 };

  const db = getDb();
  const conditions = [];

  if (filter.status) conditions.push(eq(contactInquiries.status, filter.status));
  if (filter.query) {
    const term = `%${filter.query}%`;
    conditions.push(
      or(
        ilike(contactInquiries.name, term),
        ilike(contactInquiries.email, term),
        ilike(contactInquiries.company, term),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(contactInquiries)
    .where(where)
    .orderBy(desc(contactInquiries.createdAt))
    .limit(200);

  const notes = await db
    .select({ id: inquiryNotes.id, inquiryId: inquiryNotes.inquiryId, body: inquiryNotes.body, createdAt: inquiryNotes.createdAt })
    .from(inquiryNotes)
    .orderBy(desc(inquiryNotes.createdAt));

  const items: InquiryDetail[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    projectType: row.projectType,
    budgetRange: row.budgetRange,
    timeline: row.timeline,
    message: row.message,
    status: row.status,
    isRead: row.isRead,
    createdAt: row.createdAt,
    notes: notes
      .filter((note) => note.inquiryId === row.id)
      .map((note) => ({ id: note.id, body: note.body, createdAt: note.createdAt })),
  }));

  return { items, total: items.length };
}

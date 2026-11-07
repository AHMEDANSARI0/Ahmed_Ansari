import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { mediaAssets } from "@/lib/db/schema";
import { hasDatabase } from "@/lib/rsc-guard";

export type MediaAsset = {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: Date;
};

export async function listMedia(options?: {
  kind?: "image" | "document" | "all";
  search?: string;
  limit?: number;
}): Promise<MediaAsset[]> {
  if (!hasDatabase()) return [];

  const db = getDb();
  const filters = [];

  if (options?.kind && options.kind !== "all") filters.push(eq(mediaAssets.kind, options.kind));
  if (options?.search) {
    const pattern = `%${options.search}%`;
    filters.push(
      or(ilike(mediaAssets.originalName, pattern), ilike(mediaAssets.alt, pattern), ilike(mediaAssets.fileName, pattern)),
    );
  }

  const rows = await db
    .select()
    .from(mediaAssets)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(options?.limit ?? 120);

  return rows.map((row) => ({
    id: row.id,
    fileName: row.fileName,
    originalName: row.originalName,
    url: row.url,
    kind: row.kind,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    width: row.width,
    height: row.height,
    alt: row.alt,
    createdAt: row.createdAt,
  }));
}

export async function mediaUsage() {
  if (!hasDatabase()) return { count: 0, bytes: 0 };

  const db = getDb();
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      bytes: sql<number>`coalesce(sum(${mediaAssets.sizeBytes}), 0)::bigint`,
    })
    .from(mediaAssets);

  return { count: row?.count ?? 0, bytes: Number(row?.bytes ?? 0) };
}

"use server";

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { contactInquiries, inquiryNotes } from "@/lib/db/schema";
import { runAction } from "@/lib/actions/result";
import { requireActionContext } from "@/lib/security/guard";
import { PERMISSIONS } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { sanitizeText } from "@/lib/security/sanitize";

const CSRF_FIELD = "csrf-token";

const STATUSES = ["new", "contacted", "qualified", "converted", "archived"] as const;
type Status = (typeof STATUSES)[number];

export async function updateInquiryStatusAction(formData: FormData) {
  return runAction("crm.status", async () => {
    const context = await requireActionContext(
      PERMISSIONS.inquiriesManage,
      String(formData.get(CSRF_FIELD) ?? ""),
    );

    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "") as Status;

    if (!id) throw new AppError("Missing inquiry id.", "VALIDATION");
    if (!STATUSES.includes(status)) throw new AppError("Unknown status.", "VALIDATION");

    const db = getDb();
    const [existing] = await db
      .select({ name: contactInquiries.name })
      .from(contactInquiries)
      .where(eq(contactInquiries.id, id))
      .limit(1);

    if (!existing) throw new AppError("Inquiry not found.", "NOT_FOUND", 404);

    await db
      .update(contactInquiries)
      .set({ status, isRead: true, updatedAt: new Date() })
      .where(eq(contactInquiries.id, id));

    await recordAudit({
      adminId: context.session.id,
      action: "inquiries.status",
      entity: "contact_inquiries",
      entityId: id,
      summary: `${existing.name} -> ${status}`,
      ip: context.ip,
    });

    return { id, status };
  });
}

export async function addInquiryNoteAction(formData: FormData) {
  return runAction("crm.note", async () => {
    const context = await requireActionContext(
      PERMISSIONS.inquiriesManage,
      String(formData.get(CSRF_FIELD) ?? ""),
    );

    const id = String(formData.get("id") ?? "");
    const body = sanitizeText(String(formData.get("body") ?? ""));

    if (!id) throw new AppError("Missing inquiry id.", "VALIDATION");
    if (body.length < 2) throw new AppError("Write a note first.", "VALIDATION");
    if (body.length > 4000) throw new AppError("Keep notes under 4000 characters.", "VALIDATION");

    const db = getDb();
    const [created] = await db
      .insert(inquiryNotes)
      .values({ inquiryId: id, adminId: context.session.id, body })
      .returning({ id: inquiryNotes.id });

    await db
      .update(contactInquiries)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(contactInquiries.id, id));

    await recordAudit({
      adminId: context.session.id,
      action: "inquiries.note",
      entity: "contact_inquiries",
      entityId: id,
      summary: "Note added",
      ip: context.ip,
    });

    return { id: created?.id ?? "" };
  });
}

export async function deleteInquiryAction(formData: FormData) {
  return runAction("crm.delete", async () => {
    const context = await requireActionContext(
      PERMISSIONS.inquiriesManage,
      String(formData.get(CSRF_FIELD) ?? ""),
    );

    const id = String(formData.get("id") ?? "");
    if (!id) throw new AppError("Missing inquiry id.", "VALIDATION");

    const db = getDb();
    await db.delete(contactInquiries).where(eq(contactInquiries.id, id));

    await recordAudit({
      adminId: context.session.id,
      action: "inquiries.deleted",
      entity: "contact_inquiries",
      entityId: id,
      summary: "Inquiry deleted",
      ip: context.ip,
    });

    return { id };
  });
}

export async function markAllReadAction(formData: FormData) {
  return runAction("crm.mark-read", async () => {
    const context = await requireActionContext(
      PERMISSIONS.inquiriesManage,
      String(formData.get(CSRF_FIELD) ?? ""),
    );

    const db = getDb();
    const [row] = await db
      .update(contactInquiries)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(contactInquiries.isRead, false))
      .returning({ id: contactInquiries.id });

    await recordAudit({
      adminId: context.session.id,
      action: "inquiries.marked-read",
      entity: "contact_inquiries",
      summary: row ? "Unread inquiries marked as read" : "Nothing to mark",
      ip: context.ip,
    });

    return { ok: true };
  });
}

export async function inquiryStatsAction() {
  return runAction("crm.stats", async () => {
    await requireActionContext(PERMISSIONS.inquiriesView);
    const db = getDb();
    const rows = await db
      .select({ status: contactInquiries.status, count: sql<number>`count(*)::int` })
      .from(contactInquiries)
      .groupBy(contactInquiries.status);
    return { counts: rows };
  });
}

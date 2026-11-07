"use server";

import { headers } from "next/headers";
import { getDb } from "@/lib/db/client";
import { contactInquiries } from "@/lib/db/schema";
import { contactSchema } from "@/lib/validations/contact";
import { runAction } from "@/lib/actions/result";
import { AppError, logError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/rate-limit";
import { hashIdentifier } from "@/lib/auth/session";
import { containsSpamSignals, sanitizeEmail, sanitizeText } from "@/lib/security/sanitize";
import { hasDatabase } from "@/lib/rsc-guard";
import { queueInquiryNotification } from "@/lib/services/notifications";

export async function submitInquiryAction(formData: FormData) {
  return runAction("contact.submit", async () => {
    if (!hasDatabase()) {
      throw new AppError("The contact form is not available right now.", "CONFIG", 503);
    }

    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const userAgent = headerList.get("user-agent") ?? "";
    const ipHash = hashIdentifier(ip);

    const limit = await rateLimit({
      key: `contact:${ipHash}`,
      limit: 5,
      windowSeconds: 3600,
    });

    if (!limit.allowed) {
      throw new AppError("Too many submissions from this network. Try again later.", "RATE_LIMITED", 429);
    }

    const raw = {
      name: formData.get("name"),
      email: formData.get("email"),
      company: formData.get("company"),
      projectType: formData.get("projectType"),
      budgetRange: formData.get("budgetRange"),
      timeline: formData.get("timeline"),
      message: formData.get("message"),
      website: formData.get("website"),
    };

    const payload = contactSchema.parse(raw);

    if (payload.website && payload.website.length > 0) {
      throw new AppError("Submission rejected.", "VALIDATION", 400);
    }

    const message = sanitizeText(payload.message);
    if (containsSpamSignals(message)) {
      throw new AppError("Your message looks like automated spam.", "VALIDATION", 400);
    }

    const db = getDb();
    const [created] = await db
      .insert(contactInquiries)
      .values({
        name: sanitizeText(payload.name),
        email: sanitizeEmail(payload.email),
        company: payload.company ? sanitizeText(payload.company) : null,
        projectType: payload.projectType ? sanitizeText(payload.projectType) : null,
        budgetRange: payload.budgetRange ? sanitizeText(payload.budgetRange) : null,
        timeline: payload.timeline ? sanitizeText(payload.timeline) : null,
        message,
        ipHash,
        userAgent: userAgent.slice(0, 500),
        source: "website",
      })
      .returning({ id: contactInquiries.id });

    if (!created) {
      throw new AppError("Could not save the inquiry. Please try again.", "INTERNAL", 500);
    }

    try {
      await queueInquiryNotification({
        name: payload.name,
        email: payload.email,
        message,
      });
    } catch (error) {
      logError("contact.notify", error);
    }

    return { id: created.id };
  });
}

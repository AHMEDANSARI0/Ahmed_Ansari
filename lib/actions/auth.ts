"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { admins } from "@/lib/db/schema";
import {
  SESSION_COOKIE,
  destroySession,
  hashPassword,
  login,
  revokeAllSessions,
  sessionCookieOptions,
  validatePasswordStrength,
  verifyPassword,
} from "@/lib/auth/session";
import { getCurrentSession } from "@/lib/auth/session";
import { loginSchema, changePasswordSchema } from "@/lib/validations/shared";
import { runAction } from "@/lib/actions/result";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/rate-limit";
import { hashIdentifier } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/types";
import { CSRF_FIELD, verifySubmittedCsrf } from "@/lib/security/csrf";

export async function loginAction(formData: FormData) {
  return runAction("auth.login", async () => {
    if (!(await verifySubmittedCsrf(String(formData.get(CSRF_FIELD) ?? "")))) {
      throw new AppError("Request verification failed. Reload the page.", "FORBIDDEN", 403);
    }

    const payload = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const limit = await rateLimit({
      key: `login:${hashIdentifier(ip)}`,
      limit: 10,
      windowSeconds: 600,
    });

    if (!limit.allowed) {
      throw new AppError("Too many login attempts from this network.", "RATE_LIMITED", 429);
    }

    const outcome = await login(payload.email, payload.password, {
      ip,
      userAgent: headerList.get("user-agent") ?? undefined,
    });

    if (!outcome.ok) {
      throw new AppError(outcome.error, "UNAUTHORIZED", 401);
    }

    const store = await cookies();
    store.set(SESSION_COOKIE, outcome.token, {
      ...sessionCookieOptions,
      expires: outcome.expiresAt,
    });

    await recordAudit({
      action: "auth.login",
      entity: "admin_sessions",
      entityId: outcome.sessionId,
      summary: "Admin signed in",
      ip,
    });

    const next = formData.get("next");
    redirect(typeof next === "string" && next.startsWith("/admin") ? next : "/admin/dashboard");
  });
}

export async function loginFormAction(
  _previous: ActionResult<void> | null,
  formData: FormData,
): Promise<ActionResult<void>> {
  return loginAction(formData);
}

export async function logoutAction() {
  return runAction("auth.logout", async () => {
    const session = await getCurrentSession();
    const store = await cookies();
    store.delete(SESSION_COOKIE);
    store.delete("aa_csrf");
    if (session) {
      await destroySession(session.sessionId);
      await recordAudit({
        adminId: session.id,
        action: "auth.logout",
        entity: "admin_sessions",
        entityId: session.sessionId,
        summary: "Admin signed out",
      });
    }
    redirect("/admin/login");
  });
}

export async function changePasswordAction(formData: FormData) {
  return runAction("auth.change-password", async () => {
    const session = await getCurrentSession();
    if (!session) throw new AppError("Session expired.", "UNAUTHORIZED", 401);

    const payload = changePasswordSchema.parse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const policyErrors = validatePasswordStrength(payload.newPassword);
    if (policyErrors.length > 0) throw new AppError(policyErrors[0]!, "VALIDATION");

    const db = getDb();
    const [record] = await db
      .select({ passwordHash: admins.passwordHash })
      .from(admins)
      .where(eq(admins.id, session.id))
      .limit(1);

    if (!record || !(await verifyPassword(record.passwordHash, payload.currentPassword))) {
      throw new AppError("Current password is incorrect.", "UNAUTHORIZED", 401);
    }

    const passwordHash = await hashPassword(payload.newPassword);
    await db
      .update(admins)
      .set({ passwordHash, passwordChangedAt: new Date(), updatedAt: new Date() })
      .where(eq(admins.id, session.id));

    await revokeAllSessions(session.id);
    await recordAudit({
      adminId: session.id,
      action: "auth.password-changed",
      entity: "admins",
      entityId: session.id,
      summary: "Password changed, all sessions revoked",
    });

    const store = await cookies();
    store.delete(SESSION_COOKIE);
    return { redirect: "/admin/login" };
  });
}

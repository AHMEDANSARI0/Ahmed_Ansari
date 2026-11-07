import { headers } from "next/headers";
import { getCurrentSession, type SessionAdmin } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { can, type Permission } from "@/lib/permissions";
import { CSRF_HEADER, verifySubmittedCsrf } from "@/lib/security/csrf";

export type ActionContext = {
  session: SessionAdmin;
  ip?: string;
  userAgent?: string;
};

async function networkContext() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  return {
    ip: forwarded?.split(",")[0]?.trim() ?? headerList.get("x-real-ip") ?? undefined,
    userAgent: headerList.get("user-agent") ?? undefined,
  };
}

export async function requireActionContext(
  permission: Permission,
  submittedToken?: string | null,
): Promise<ActionContext> {
  const session = await getCurrentSession();
  if (!session) throw new AppError("Session expired. Sign in again.", "UNAUTHORIZED", 401);
  if (!can(session.role, permission)) {
    throw new AppError("You do not have permission to perform this action.", "FORBIDDEN", 403);
  }

  const headerList = await headers();
  const token = submittedToken ?? headerList.get(CSRF_HEADER);
  if (!(await verifySubmittedCsrf(token))) {
    throw new AppError("Request verification failed. Refresh the page and retry.", "FORBIDDEN", 403);
  }

  return { session, ...(await networkContext()) };
}

export async function requireReadContext(permission: Permission): Promise<ActionContext> {
  const session = await getCurrentSession();
  if (!session) throw new AppError("Session expired. Sign in again.", "UNAUTHORIZED", 401);
  if (!can(session.role, permission)) {
    throw new AppError("You do not have permission to view this.", "FORBIDDEN", 403);
  }
  return { session, ...(await networkContext()) };
}

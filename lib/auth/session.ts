import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, isNull, lt, or } from "drizzle-orm";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { getDb } from "@/lib/db/client";
import { adminRoles, adminSessions, admins, loginAttempts } from "@/lib/db/schema";
import { requireSessionSecret } from "@/lib/env";

export const SESSION_COOKIE = "aa_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const MAX_FAILED_ATTEMPTS = 6;
const LOCK_WINDOW_MS = 1000 * 60 * 15;

const ARGON_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export type SessionAdmin = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "editor" | "viewer";
  sessionId: string;
};

export function hashToken(token: string) {
  return createHash("sha256").update(`${token}${requireSessionSecret()}`).digest("hex");
}

export function hashIdentifier(value: string) {
  return createHash("sha256")
    .update(`${value.trim().toLowerCase()}${requireSessionSecret()}`)
    .digest("hex");
}

export function generateSessionToken() {
  return randomBytes(32).toString("base64url");
}

export async function hashPassword(password: string) {
  return argonHash(password, ARGON_OPTIONS);
}

export async function verifyPassword(hash: string, password: string) {
  try {
    return await argonVerify(hash, password, ARGON_OPTIONS);
  } catch {
    return false;
  }
}

export type LoginOutcome =
  | { ok: true; token: string; sessionId: string; expiresAt: Date }
  | { ok: false; error: string };

export async function login(
  email: string,
  password: string,
  context: { ip?: string; userAgent?: string },
): Promise<LoginOutcome> {
  const db = getDb();
  const identifier = email.trim().toLowerCase();
  const ipHash = context.ip ? hashIdentifier(context.ip) : null;
  const windowStart = new Date(Date.now() - LOCK_WINDOW_MS);

  const recentFailures = await db
    .select({ id: loginAttempts.id })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.identifier, identifier),
        eq(loginAttempts.succeeded, false),
        gt(loginAttempts.createdAt, windowStart),
      ),
    );

  if (recentFailures.length >= MAX_FAILED_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  }

  const rows = await db
    .select({
      id: admins.id,
      email: admins.email,
      name: admins.name,
      passwordHash: admins.passwordHash,
      isActive: admins.isActive,
      roleKey: adminRoles.key,
    })
    .from(admins)
    .innerJoin(adminRoles, eq(adminRoles.id, admins.roleId))
    .where(eq(admins.email, identifier))
    .limit(1);

  const admin = rows[0];
  const passwordOk = admin ? await verifyPassword(admin.passwordHash, password) : false;

  if (!admin || !passwordOk || !admin.isActive) {
    await db.insert(loginAttempts).values({
      identifier,
      ipHash,
      succeeded: false,
    });
    return { ok: false, error: "Invalid email or password." };
  }

  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const [session] = await db
    .insert(adminSessions)
    .values({
      adminId: admin.id,
      tokenHash,
      expiresAt,
      userAgent: context.userAgent?.slice(0, 500),
      ipHash,
    })
    .returning({ id: adminSessions.id });

  if (!session) return { ok: false, error: "Could not create a session. Try again." };

  await Promise.all([
    db.insert(loginAttempts).values({ identifier, ipHash, succeeded: true }),
    db
      .update(admins)
      .set({ lastLoginAt: new Date(), failedAttempts: 0 })
      .where(eq(admins.id, admin.id)),
    db
      .delete(adminSessions)
      .where(and(eq(adminSessions.adminId, admin.id), lt(adminSessions.expiresAt, new Date()))),
  ]);

  return { ok: true, token, sessionId: session.id, expiresAt };
}

export async function getSessionFromToken(token: string): Promise<SessionAdmin | null> {
  const db = getDb();
  const rows = await db
    .select({
      sessionId: adminSessions.id,
      adminId: admins.id,
      email: admins.email,
      name: admins.name,
      roleKey: adminRoles.key,
      isActive: admins.isActive,
    })
    .from(adminSessions)
    .innerJoin(admins, eq(admins.id, adminSessions.adminId))
    .innerJoin(adminRoles, eq(adminRoles.id, admins.roleId))
    .where(
      and(
        eq(adminSessions.tokenHash, hashToken(token)),
        gt(adminSessions.expiresAt, new Date()),
        isNull(adminSessions.revokedAt),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row || !row.isActive) return null;

  return {
    id: row.adminId,
    email: row.email,
    name: row.name,
    role: row.roleKey,
    sessionId: row.sessionId,
  };
}

export async function getCurrentSession(): Promise<SessionAdmin | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await getSessionFromToken(token);
  } catch {
    return null;
  }
}

export async function destroySession(sessionId: string) {
  const db = getDb();
  await db
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(eq(adminSessions.id, sessionId));
}

export async function revokeAllSessions(adminId: string) {
  const db = getDb();
  await db
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(adminSessions.adminId, adminId), or(isNull(adminSessions.revokedAt))));
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};

export const PASSWORD_POLICY = {
  minLength: 12,
  requireNumber: true,
  requireSymbol: true,
};

export function validatePasswordStrength(password: string) {
  const errors: string[] = [];
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters.`);
  }
  if (PASSWORD_POLICY.requireNumber && !/\d/.test(password)) {
    errors.push("Password must contain a number.");
  }
  if (PASSWORD_POLICY.requireSymbol && !/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain a symbol.");
  }
  return errors;
}

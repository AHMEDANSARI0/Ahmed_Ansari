import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { CSRF_COOKIE, CSRF_FIELD } from "@/lib/csrf-constants";

export { CSRF_COOKIE, CSRF_FIELD };
export { CSRF_HEADER } from "@/lib/csrf-constants";
const TTL_MS = 1000 * 60 * 60 * 4;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not configured.");
  return value;
}

function sign(nonce: string) {
  return createHmac("sha256", secret()).update(nonce).digest("base64url");
}

export function createCsrfToken() {
  const nonce = `${randomUUID()}.${Date.now() + TTL_MS}`;
  return `${nonce}.${sign(nonce)}`;
}

export function verifyCsrfToken(token: string | undefined | null) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [id, expiry, signature] = parts as [string, string, string];
  if (sign(`${id}.${expiry}`) !== signature) return false;
  return Number(expiry) > Date.now();
}

export async function getCsrfToken() {
  const store = await cookies();
  const token = store.get(CSRF_COOKIE)?.value;
  return token && verifyCsrfToken(token) ? token : null;
}

export async function verifySubmittedCsrf(submitted: string | null | undefined) {
  const cookieToken = await getCsrfToken();
  if (!cookieToken || !submitted) return false;
  const a = Buffer.from(cookieToken);
  const b = Buffer.from(submitted);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b) && verifyCsrfToken(submitted);
}

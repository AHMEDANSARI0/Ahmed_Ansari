"use client";

/**
 * A random, first-party identifier kept in localStorage.
 *
 * It is not a cookie, it is not sent to any third party, and it is only used to
 * recognise the owner's own browser so their visits are not counted. A visitor
 * who blocks local storage simply has no id, and can only be excluded through
 * the daily hash.
 */
export const BROWSER_ID_KEY = "portfolio.bid";

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function readBrowserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(BROWSER_ID_KEY);
    if (existing && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing;
    const created = newId();
    window.localStorage.setItem(BROWSER_ID_KEY, created);
    return created;
  } catch {
    // Private mode or a browser that refuses storage. Nothing is invented.
    return null;
  }
}

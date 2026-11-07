import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { hasDatabase } from "@/lib/rsc-guard";
import { LoginForm } from "./login-form";
import { CSRF_FIELD, getCsrfToken } from "@/lib/security/csrf";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (!hasDatabase()) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md border border-line bg-ink-soft/60 p-8">
          <p className="mono-label text-accent">CONFIGURATION REQUIRED</p>
          <h1 className="mt-4 text-2xl font-semibold">Database not connected</h1>
          <p className="mt-3 text-sm text-fg-muted">
            Set DATABASE_URL in .env.local, then run the migrations, seed and admin setup scripts.
          </p>
        </div>
      </main>
    );
  }

  const session = await getCurrentSession();
  if (session) redirect("/admin/dashboard");

  const { next } = await searchParams;
  const csrfToken = await getCsrfToken();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="mono-label text-accent">CONTROL PLANE</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Admin access</h1>
          </div>
          <div className="border border-line px-2 py-1 font-mono text-[10px] tracking-[0.18em] text-fg-dim">
            v1.0
          </div>
        </div>

        <div className="border border-line bg-card/60 p-7">
          <LoginForm next={next}>
            <input type="hidden" name={CSRF_FIELD} value={csrfToken ?? ""} />
          </LoginForm>
        </div>

        <div className="mt-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-fg-dim">
          <span>Encrypted session</span>
          <span>Argon2id</span>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { loginFormAction } from "@/lib/actions/auth";
import { Input, Field } from "@/components/ui/field";
import type { ActionResult } from "@/types";

export function LoginForm({ next, children }: { next?: string; children?: React.ReactNode }) {
  const [state, formAction, pending] = useActionState<ActionResult<void> | null, FormData>(
    loginFormAction,
    null,
  );

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="space-y-5">
      {children}
      <input type="hidden" name="next" value={next ?? "/admin/dashboard"} />

      <Field label="Email" htmlFor="email" required error={fieldErrors.email?.[0]}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@domain.com"
          required
        />
      </Field>

      <Field label="Password" htmlFor="password" required error={fieldErrors.password?.[0]}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          required
        />
      </Field>

      {state && !state.ok ? (
        <p className="border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12px] text-red-300">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="group flex h-11 w-full items-center justify-center gap-2 bg-accent mono-label text-ink transition-colors hover:bg-accent/90 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LockKeyhole className="h-3.5 w-3.5" />}
        {pending ? "Verifying" : "Sign in"}
        {!pending ? (
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        ) : null}
      </button>

      <p className="text-center text-[11px] text-fg-dim">
        Owner access only.{" "}
        <Link href="/" className="text-fg-muted underline-offset-4 hover:text-accent hover:underline">
          Back to site
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { changePasswordAction } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/types";

export function ChangePasswordForm() {
  const toast = useToast();
  const router = useRouter();

  const [state, formAction, pending] = useActionState<ActionResult<unknown> | null, FormData>(
    async (_previous, formData) => {
      const result = await changePasswordAction(formData);
      if (result.ok) {
        toast.success("Password updated", "Sign in again with the new password.");
        router.push("/admin/login");
      }
      return result;
    },
    null,
  );

  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="grid max-w-xl gap-4 sm:grid-cols-2">
      <Field
        label="Current password"
        htmlFor="currentPassword"
        required
        error={errors.currentPassword?.[0]}
        className="sm:col-span-2"
      >
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>

      <Field
        label="New password"
        htmlFor="newPassword"
        required
        hint="Minimum 12 characters, one number and one symbol."
        error={errors.newPassword?.[0]}
      >
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required />
      </Field>

      <Field
        label="Confirm password"
        htmlFor="confirmPassword"
        required
        error={errors.confirmPassword?.[0]}
      >
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </Field>

      {state && !state.ok ? (
        <p className="sm:col-span-2 border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12px] text-red-300">
          {state.error}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-10 items-center gap-2 bg-accent px-5 mono-label text-ink hover:bg-accent/90 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Update password
        </button>
      </div>
    </form>
  );
}

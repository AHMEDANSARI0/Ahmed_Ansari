"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => void logoutAction())}
      className="flex h-8 items-center gap-1.5 border border-line px-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted transition-colors hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
    >
      <LogOut className="h-3 w-3" />
      {pending ? "Signing out" : "Sign out"}
    </button>
  );
}

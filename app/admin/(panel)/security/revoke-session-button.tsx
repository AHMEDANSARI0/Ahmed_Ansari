"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { revokeSessionAction } from "@/lib/actions/security";
import { useToast } from "@/components/ui/toast";

export function RevokeSessionButton({ sessionId }: { sessionId: string }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await revokeSessionAction(sessionId);
          if (result.ok) toast.success("Session revoked");
          else toast.error("Could not revoke", result.error);
        })
      }
      className="flex h-8 shrink-0 items-center gap-1.5 border border-line px-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      Revoke
    </button>
  );
}

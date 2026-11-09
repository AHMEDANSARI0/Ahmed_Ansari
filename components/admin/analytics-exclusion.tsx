"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, ShieldCheck, Trash2, UserMinus } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { csrfFormData } from "@/components/admin/studio";
import { readBrowserId } from "@/lib/analytics/browser-id";
import {
  excludeCurrentVisitorAction,
  removeVisitorExclusionAction,
} from "@/lib/actions/analytics";
import type { ExcludedVisitor } from "@/lib/config/site";

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function AnalyticsExclusion({ exclusions }: { exclusions: ExcludedVisitor[] }) {
  const router = useRouter();
  const toast = useToast();
  const [label, setLabel] = useState("My browser");
  const [pending, startTransition] = useTransition();

  const exclude = () => {
    startTransition(async () => {
      const formData = csrfFormData();
      formData.set("label", label.trim() || "My browser");
      // The server derives the hash; the id never leaves this request pair.
      formData.set("browserId", readBrowserId() ?? "");

      const result = await excludeCurrentVisitorAction(formData);
      if (result.ok) {
        toast.success(
          "This browser is excluded",
          "Your next page view will not be counted. The daily hash is refreshed every day.",
        );
        router.refresh();
      } else {
        toast.error("Could not exclude", result.error);
      }
    });
  };

  const restore = (hash: string) => {
    startTransition(async () => {
      const formData = csrfFormData();
      formData.set("hash", hash);
      const result = await removeVisitorExclusionAction(formData);
      if (result.ok) {
        toast.success("Counting again");
        router.refresh();
      } else {
        toast.error("Could not restore", result.error);
      }
    });
  };

  return (
    <section className="border border-line bg-card/40">
      <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
            Counting
          </h2>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-fg-dim">
            Exclude your own visits. Only a truncated hash is stored: no IP, no cookie, no
            third-party script.
          </p>
        </div>
        <Badge tone={exclusions.length > 0 ? "success" : "muted"}>
          {exclusions.length > 0 ? `${exclusions.length} excluded` : "counting everything"}
        </Badge>
      </header>

      <div className="space-y-4 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field label="Label" htmlFor="exclusion-label" hint="Only you see this name." className="flex-1">
            <Input
              id="exclusion-label"
              value={label}
              maxLength={60}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="My browser"
            />
          </Field>
          <button
            type="button"
            onClick={exclude}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 angular-clip bg-accent px-5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink transition-colors hover:bg-accent/90 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
            Exclude this browser
          </button>
        </div>

        {exclusions.length === 0 ? (
          <p className="border border-dashed border-line px-4 py-6 text-center text-[12px] text-fg-muted">
            Nothing is excluded yet, so every real visit is counted, including yours.
          </p>
        ) : (
          <ul className="divide-y divide-line border border-line">
            {exclusions.map((entry) => (
              <li key={entry.hash} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-fg">{entry.label}</p>
                  <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-dim">
                    {entry.kind === "browser" ? "browser" : "daily"} · {entry.hash.slice(0, 10)}… ·
                    added {when(entry.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => restore(entry.hash)}
                  disabled={pending}
                  className="inline-flex h-8 items-center gap-1.5 border border-line px-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-muted transition-colors hover:border-accent/60 hover:text-accent disabled:opacity-60"
                >
                  <RotateCcw className="h-3 w-3" />
                  Count again
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2 border-l border-line pl-3">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-dim" />
          <div className="space-y-1 text-[11px] leading-relaxed text-fg-dim">
            <p>
              <span className="text-fg-muted">Honest limits.</span> The daily hash expires at
              midnight UTC, so a new device can only be excluded once it visits again. The browser
              id lives in local storage: a browser that blocks storage has no id, and its visits
              are only excluded for the rest of the day.
            </p>
            <p className="inline-flex items-center gap-1.5">
              <Trash2 className="h-3 w-3" /> Removing an entry restores counting immediately.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

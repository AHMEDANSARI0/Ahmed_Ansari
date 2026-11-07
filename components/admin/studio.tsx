"use client";

import { useTransition } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { CSRF_FIELD } from "@/lib/csrf-constants";

export function readCsrfCookie() {
  const value = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("aa_csrf="))
    ?.slice("aa_csrf=".length);
  return decodeURIComponent(value ?? "");
}

export function csrfFormData() {
  const formData = new FormData();
  formData.set(CSRF_FIELD, readCsrfCookie());
  return formData;
}

export function StudioSaveBar({
  onSave,
  onReset,
  dirty,
  status,
}: {
  onSave: () => Promise<boolean>;
  onReset?: () => Promise<boolean>;
  dirty: boolean;
  status?: string;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<boolean>, success: string, failure: string) => {
    startTransition(async () => {
      const ok = await action();
      if (ok) toast.success(success);
      else toast.error(failure);
    });
  };

  return (
    <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-ink/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <span
          className={`h-1.5 w-1.5 rotate-45 ${dirty ? "bg-accent" : "bg-fg-dim"}`}
          aria-hidden
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim">
          {dirty ? "Unsaved changes" : status ?? "Saved"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {onReset ? (
          <button
            type="button"
            onClick={() => run(onReset, "Reset to defaults", "Reset failed")}
            disabled={pending}
            className="inline-flex h-9 items-center gap-2 border border-line px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted hover:border-red-500/50 hover:text-red-300 disabled:opacity-50"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => run(onSave, "Changes saved", "Could not save")}
          disabled={pending || !dirty}
          className="inline-flex h-9 items-center gap-2 bg-accent px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink disabled:opacity-40"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save
        </button>
      </div>
    </div>
  );
}

export function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 border border-line px-3 py-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase text-fg-dim">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-6 w-8 cursor-pointer border border-line bg-transparent"
          aria-label={`${label} colour`}
        />
      </span>
    </label>
  );
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="border border-line px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">{label}</span>
        <span className="font-mono text-[10px] text-accent">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-1 w-full cursor-pointer appearance-none bg-line accent-accent"
        aria-label={label}
      />
    </div>
  );
}

export function ToggleControl({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border border-line px-3 py-2.5">
      <span>
        <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">
          {label}
        </span>
        {hint ? <span className="mt-0.5 block text-[11px] text-fg-dim">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 shrink-0 border transition-colors ${
          value ? "border-accent bg-accent/25" : "border-line bg-ink"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 transition-all ${
            value ? "left-[18px] bg-accent" : "left-0.5 bg-fg-dim"
          }`}
        />
      </button>
    </label>
  );
}

export function StudioSectionHeader({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
      <div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-fg">{title}</h2>
        {description ? <p className="mt-1 text-[11.5px] text-fg-dim">{description}</p> : null}
      </div>
      {right}
    </div>
  );
}

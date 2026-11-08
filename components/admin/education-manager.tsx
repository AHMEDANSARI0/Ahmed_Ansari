"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, GraduationCap, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Field, Input, Switch, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { csrfFormData } from "@/components/admin/studio";
import {
  createEducationAction,
  deleteEducationAction,
  moveEducationAction,
  updateEducationAction,
} from "@/lib/actions/education";
import { educationEntrySchema } from "@/lib/validations/education";
import type { EducationRecord } from "@/lib/services/education-admin";

type Draft = {
  institution: string;
  program: string;
  location: string;
  startYear: string;
  endYear: string;
  summary: string;
  isVisible: boolean;
};

const emptyDraft: Draft = {
  institution: "",
  program: "",
  location: "",
  startYear: String(new Date().getFullYear()),
  endYear: "",
  summary: "",
  isVisible: true,
};

function toDraft(record: EducationRecord): Draft {
  return {
    institution: record.institution,
    program: record.program,
    location: record.location ?? "",
    startYear: record.startYear,
    endYear: record.endYear ?? "",
    summary: record.summary ?? "",
    isVisible: record.isVisible,
  };
}

export function EducationManager({ entries }: { entries: EducationRecord[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const patch = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (record: EducationRecord) => {
    setEditingId(record.id);
    setDraft(toDraft(record));
    setErrors({});
    setFormOpen(true);
  };

  const close = () => {
    setFormOpen(false);
    setEditingId(null);
    setErrors({});
  };

  const save = () => {
    // Client validation mirrors the server schema so the error appears instantly.
    const parsed = educationEntrySchema.safeParse(draft);
    if (!parsed.success) {
      const next: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        next[key] = [...(next[key] ?? []), issue.message];
      }
      setErrors(next);
      toast.error("Check the highlighted fields");
      return;
    }

    setErrors({});
    startTransition(async () => {
      const formData = csrfFormData();
      formData.set("payload", JSON.stringify(parsed.data));
      if (editingId) formData.set("id", editingId);

      const result = editingId
        ? await updateEducationAction(formData)
        : await createEducationAction(formData);

      if (result.ok) {
        toast.success(editingId ? "Entry updated" : "Entry added");
        close();
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        toast.error("Could not save", result.error);
      }
    });
  };

  const remove = (record: EducationRecord) => {
    const confirmed = window.confirm(
      `Delete "${record.program}" at ${record.institution}? This cannot be undone.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const formData = csrfFormData();
      formData.set("id", record.id);
      const result = await deleteEducationAction(formData);
      if (result.ok) {
        toast.success("Entry deleted");
        router.refresh();
      } else {
        toast.error("Could not delete", result.error);
      }
    });
  };

  const move = (record: EducationRecord, direction: "up" | "down") => {
    startTransition(async () => {
      const formData = csrfFormData();
      formData.set("id", record.id);
      formData.set("direction", direction);
      const result = await moveEducationAction(formData);
      if (result.ok) router.refresh();
      else toast.error("Could not reorder", result.error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge tone={entries.length > 0 ? "accent" : "muted"}>
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </Badge>
          {entries.length === 0 ? (
            <span className="text-[11.5px] text-fg-dim">
              Nothing is rendered on the public site while this list is empty.
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-9 items-center gap-2 angular-clip bg-accent px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-accent/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add entry
        </button>
      </div>

      {formOpen ? (
        <section className="border border-line bg-card/40">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
              {editingId ? "Edit entry" : "New entry"}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close form"
              className="text-fg-dim transition-colors hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="space-y-4 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Institution"
                htmlFor="institution"
                required
                error={errors.institution?.[0]}
              >
                <Input
                  id="institution"
                  value={draft.institution}
                  maxLength={160}
                  onChange={(event) => patch("institution", event.target.value)}
                  placeholder="University of Karachi"
                />
              </Field>
              <Field label="Programme" htmlFor="program" required error={errors.program?.[0]}>
                <Input
                  id="program"
                  value={draft.program}
                  maxLength={160}
                  onChange={(event) => patch("program", event.target.value)}
                  placeholder="BS Computer Science"
                />
              </Field>
              <Field label="Location" htmlFor="location" hint="Optional">
                <Input
                  id="location"
                  value={draft.location}
                  maxLength={120}
                  onChange={(event) => patch("location", event.target.value)}
                  placeholder="Karachi, Pakistan"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start year" htmlFor="startYear" required error={errors.startYear?.[0]}>
                  <Input
                    id="startYear"
                    inputMode="numeric"
                    value={draft.startYear}
                    maxLength={4}
                    onChange={(event) => patch("startYear", event.target.value)}
                    placeholder="2019"
                  />
                </Field>
                <Field
                  label="End year"
                  htmlFor="endYear"
                  hint="Empty means present"
                  error={errors.endYear?.[0]}
                >
                  <Input
                    id="endYear"
                    inputMode="numeric"
                    value={draft.endYear}
                    maxLength={4}
                    onChange={(event) => patch("endYear", event.target.value)}
                    placeholder="2023"
                  />
                </Field>
              </div>
            </div>

            <Field label="Summary" htmlFor="summary" hint="Optional, one or two lines." error={errors.summary?.[0]}>
              <Textarea
                id="summary"
                rows={3}
                value={draft.summary}
                maxLength={1000}
                onChange={(event) => patch("summary", event.target.value)}
              />
            </Field>

            <Switch
              checked={draft.isVisible}
              onChange={(value) => patch("isVisible", value)}
              label="Visible on the public site"
              description="Hidden entries stay here but never render."
            />

            <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={close}
                className="inline-flex h-9 items-center border border-line px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted hover:text-fg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="inline-flex h-9 items-center gap-2 angular-clip bg-accent px-5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:bg-accent/90 disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {editingId ? "Save changes" : "Add entry"}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {entries.length === 0 && !formOpen ? (
        <div className="border border-dashed border-line px-6 py-12 text-center">
          <GraduationCap className="mx-auto h-5 w-5 text-fg-dim" />
          <p className="mt-3 text-sm text-fg-muted">No education entries yet.</p>
          <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-fg-dim">
            Add the real institution and years. Until then the public About section shows no
            education block at all.
          </p>
        </div>
      ) : null}

      {entries.length > 0 ? (
        <ul className="divide-y divide-line border border-line">
          {entries.map((entry, index) => (
            <li key={entry.id} className="flex flex-wrap items-start justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-[13.5px] uppercase tracking-wide text-fg">
                    {entry.program}
                  </p>
                  {!entry.isVisible ? <Badge tone="muted">hidden</Badge> : null}
                </div>
                <p className="mt-1 text-[12.5px] text-fg-muted">
                  {entry.institution}
                  {entry.location ? ` · ${entry.location}` : ""}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim">
                  {entry.startYear} — {entry.endYear ?? "present"}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(entry, "up")}
                  disabled={pending || index === 0}
                  aria-label={`Move ${entry.program} up`}
                  className="flex h-8 w-8 items-center justify-center border border-line text-fg-muted hover:text-accent disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(entry, "down")}
                  disabled={pending || index === entries.length - 1}
                  aria-label={`Move ${entry.program} down`}
                  className="flex h-8 w-8 items-center justify-center border border-line text-fg-muted hover:text-accent disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(entry)}
                  disabled={pending}
                  aria-label={`Edit ${entry.program}`}
                  className="flex h-8 w-8 items-center justify-center border border-line text-fg-muted hover:text-accent disabled:opacity-30"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(entry)}
                  disabled={pending}
                  aria-label={`Delete ${entry.program}`}
                  className="flex h-8 w-8 items-center justify-center border border-line text-fg-muted hover:border-red-500/40 hover:text-red-300 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

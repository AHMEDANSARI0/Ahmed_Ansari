"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Save, X } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { csrfFormData, StudioSaveBar, StudioSectionHeader } from "@/components/admin/studio";
import { useToast } from "@/components/ui/toast";
import {
  reorderSectionsAction,
  updateSectionAction,
  updateSectionContentAction,
} from "@/lib/actions/studio";
import type { StudioSection } from "@/lib/services/studio";

type Draft = {
  label: string;
  navLabel: string;
  anchor: string;
  eyebrow: string;
  heading: string;
  description: string;
  isVisible: boolean;
  showInNav: boolean;
  animationType: string;
};

const animationTypes = ["fade-up", "mask-reveal", "word-reveal", "char-reveal", "stagger-grid", "clip-path", "none"];

function toDraft(section: StudioSection): Draft {
  return {
    label: section.label,
    navLabel: section.navLabel ?? "",
    anchor: section.anchor,
    eyebrow: section.eyebrow ?? "",
    heading: section.heading ?? "",
    description: section.description ?? "",
    isVisible: section.isVisible,
    showInNav: section.showInNav,
    animationType: section.animationType ?? "",
  };
}

export function SectionsManager({
  initial,
  editableFields,
}: {
  initial: StudioSection[];
  editableFields: Record<string, string[]>;
}) {
  const toast = useToast();
  const [order, setOrder] = useState(initial);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(initial.map((section) => [section.key, toDraft(section)])),
  );
  const [active, setActive] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(
      initial.map((section) => [
        section.key,
        Object.fromEntries(
          Object.entries(section.fields).map(([key, value]) => [key, formatValue(value)]),
        ),
      ]),
    ),
  );
  const [pending, startTransition] = useTransition();
  const [orderDirty, setOrderDirty] = useState(false);

  const dirtyKeys = useMemo(
    () =>
      order
        .filter((section) => {
          const draft = drafts[section.key]!;
          const original = toDraft(section);
          return JSON.stringify(draft) !== JSON.stringify(original);
        })
        .map((section) => section.key),
    [order, drafts],
  );

  function move(index: number, direction: -1 | 1) {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setOrder(next);
    setOrderDirty(true);
  }

  async function saveOrder() {
    const formData = csrfFormData();
    formData.set("payload", JSON.stringify({ order: order.map((section) => section.key) }));
    const result = await reorderSectionsAction(formData);
    if (result.ok) setOrderDirty(false);
    return result.ok;
  }

  async function saveSection(key: string) {
    const draft = drafts[key]!;
    const formData = csrfFormData();
    formData.set(
      "payload",
      JSON.stringify({
        key,
        label: draft.label,
        navLabel: draft.navLabel || null,
        anchor: draft.anchor,
        eyebrow: draft.eyebrow || "SECTION",
        heading: draft.heading || null,
        description: draft.description || null,
        isVisible: draft.isVisible,
        showInNav: draft.showInNav,
        animationType: draft.animationType || null,
      }),
    );
    const result = await updateSectionAction(formData);

    if (result.ok) {
      setOrder((current) =>
        current.map((section) =>
          section.key === key
            ? {
                ...section,
                ...draft,
                navLabel: draft.navLabel || null,
                eyebrow: draft.eyebrow || null,
                heading: draft.heading || null,
                description: draft.description || null,
                animationType: draft.animationType || null,
              }
            : section,
        ),
      );
    } else {
      toast.error("Section not saved", result.error);
    }

    return result.ok;
  }

  async function saveFields(key: string) {
    const fields = fieldValues[key] ?? {};
    const parsed = Object.fromEntries(
      Object.entries(fields).map(([fieldKey, value]) => [fieldKey, parseValue(value)]),
    );

    const formData = csrfFormData();
    formData.set("payload", JSON.stringify({ key, fields: parsed }));
    const result = await updateSectionContentAction(formData);
    if (result.ok) toast.success("Content saved", `${Object.keys(parsed).length} fields updated`);
    else toast.error("Content not saved", result.error);
    return result.ok;
  }

  const activeSection = active ? order.find((section) => section.key === active) ?? null : null;

  return (
    <div className="space-y-6">
      <section className="border border-line bg-card/40">
        <div className="px-4 pt-4">
          <StudioSectionHeader
            title="Section order"
            description="Controls the order sections render on the public page."
            right={
              <button
                type="button"
                disabled={!orderDirty || pending}
                onClick={() => startTransition(async () => {
                  const ok = await saveOrder();
                  if (ok) toast.success("Order saved");
                  else toast.error("Order not saved");
                })}
                className="inline-flex h-8 items-center gap-2 bg-accent px-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink disabled:opacity-40"
              >
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Save order
              </button>
            }
          />
        </div>

        <ul className="divide-y divide-line">
          {order.map((section, index) => {
            const draft = drafts[section.key]!;
            const changed = dirtyKeys.includes(section.key);

            return (
              <li key={section.key} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <span className="w-6 font-mono text-[10px] tabular-nums text-fg-dim">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[13px] uppercase tracking-[0.08em] text-fg">
                    {draft.label}
                  </span>
                  <span className="mt-0.5 block font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-dim">
                    #{draft.anchor} {changed ? "· edited" : ""}
                  </span>
                </span>

                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setDrafts((current) => ({
                        ...current,
                        [section.key]: { ...draft, isVisible: !draft.isVisible },
                      }))
                    }
                    aria-label={draft.isVisible ? `Hide ${draft.label}` : `Show ${draft.label}`}
                    className={`inline-flex h-7 w-7 items-center justify-center border ${
                      draft.isVisible
                        ? "border-line text-fg-muted hover:text-accent"
                        : "border-red-500/40 text-red-300"
                    }`}
                  >
                    {draft.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    aria-label={`Move ${draft.label} up`}
                    className="inline-flex h-7 w-7 items-center justify-center border border-line text-fg-muted hover:text-accent"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    aria-label={`Move ${draft.label} down`}
                    className="inline-flex h-7 w-7 items-center justify-center border border-line text-fg-muted hover:text-accent"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActive(section.key)}
                    className="h-7 border border-line px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-fg-muted hover:border-accent/60 hover:text-accent"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => startTransition(async () => { await saveSection(section.key); })}
                    disabled={!changed}
                    className="h-7 bg-accent/90 px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink disabled:opacity-30"
                  >
                    Save
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {activeSection ? (
        <section className="border border-line bg-card/40">
          <div className="flex items-center justify-between px-4 pt-4">
            <StudioSectionHeader
              title={`${drafts[activeSection.key]!.label} — content`}
              description="Headings, labels and structured content for this section."
            />
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close editor"
              className="mb-3 inline-flex h-7 w-7 items-center justify-center border border-line text-fg-muted hover:text-accent"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <Field label="Label" htmlFor="label" required>
              <Input
                id="label"
                value={drafts[activeSection.key]!.label}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [activeSection.key]: { ...current[activeSection.key]!, label: event.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Nav label" htmlFor="navLabel" hint="Defaults to the label.">
              <Input
                id="navLabel"
                value={drafts[activeSection.key]!.navLabel}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [activeSection.key]: { ...current[activeSection.key]!, navLabel: event.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Anchor" htmlFor="anchor" hint="Public hash target, e.g. #work.">
              <Input
                id="anchor"
                value={drafts[activeSection.key]!.anchor}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [activeSection.key]: {
                      ...current[activeSection.key]!,
                      anchor: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    },
                  }))
                }
              />
            </Field>
            <Field label="Eyebrow" htmlFor="eyebrow">
              <Input
                id="eyebrow"
                value={drafts[activeSection.key]!.eyebrow}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [activeSection.key]: { ...current[activeSection.key]!, eyebrow: event.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Heading" htmlFor="heading" className="sm:col-span-2">
              <Input
                id="heading"
                value={drafts[activeSection.key]!.heading}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [activeSection.key]: { ...current[activeSection.key]!, heading: event.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Description" htmlFor="description" className="sm:col-span-2">
              <Textarea
                id="description"
                rows={3}
                value={drafts[activeSection.key]!.description}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [activeSection.key]: {
                      ...current[activeSection.key]!,
                      description: event.target.value,
                    },
                  }))
                }
              />
            </Field>
            <Field label="Reveal animation" htmlFor="animationType">
              <select
                id="animationType"
                value={drafts[activeSection.key]!.animationType}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [activeSection.key]: {
                      ...current[activeSection.key]!,
                      animationType: event.target.value,
                    },
                  }))
                }
                className="h-10 w-full border border-line bg-ink px-3 text-sm text-fg"
              >
                <option value="">Use global default</option>
                {animationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Show in navigation" htmlFor="showInNav">
              <select
                id="showInNav"
                value={drafts[activeSection.key]!.showInNav ? "yes" : "no"}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [activeSection.key]: {
                      ...current[activeSection.key]!,
                      showInNav: event.target.value === "yes",
                    },
                  }))
                }
                className="h-10 w-full border border-line bg-ink px-3 text-sm text-fg"
              >
                <option value="yes">Visible in nav</option>
                <option value="no">Hidden from nav</option>
              </select>
            </Field>
          </div>

          {(editableFields[activeSection.key] ?? []).length > 0 ? (
            <div className="border-t border-line p-4">
              <StudioSectionHeader
                title="Structured content"
                description="Arrays are edited as one entry per line."
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(editableFields[activeSection.key] ?? []).map((fieldKey) => (
                  <Field key={fieldKey} label={fieldKey} htmlFor={`field-${fieldKey}`}>
                    <Textarea
                      id={`field-${fieldKey}`}
                      rows={3}
                      value={fieldValues[activeSection.key]?.[fieldKey] ?? ""}
                      onChange={(event) =>
                        setFieldValues((current) => ({
                          ...current,
                          [activeSection.key]: {
                            ...(current[activeSection.key] ?? {}),
                            [fieldKey]: event.target.value,
                          },
                        }))
                      }
                    />
                  </Field>
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => startTransition(async () => { await saveFields(activeSection.key); })}
                  className="inline-flex h-8 items-center gap-2 bg-accent px-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink"
                >
                  <Save className="h-3 w-3" />
                  Save content
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <StudioSaveBar
        onSave={async () => {
          let ok = true;
          for (const key of dirtyKeys) {
            ok = (await saveSection(key)) && ok;
          }
          return ok;
        }}
        dirty={dirtyKeys.length > 0}
        status={`${order.length} sections`}
      />
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        typeof entry === "string" ? entry : typeof entry === "object" && entry !== null ? JSON.stringify(entry) : String(entry),
      )
      .join("\n");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function parseValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
    }
  }
  if (trimmed.includes("\n")) {
    return trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        if (line.startsWith("{")) {
          try {
            return JSON.parse(line);
          } catch {
            return line;
          }
        }
        return line;
      });
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) && trimmed !== "" && String(numeric) === trimmed ? numeric : trimmed;
}

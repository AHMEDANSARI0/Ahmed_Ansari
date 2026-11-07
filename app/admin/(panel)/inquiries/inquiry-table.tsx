"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Loader2, Mail, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Field, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { csrfFormData } from "@/components/admin/studio";
import {
  addInquiryNoteAction,
  deleteInquiryAction,
  markAllReadAction,
  updateInquiryStatusAction,
} from "@/lib/actions/crm";
import { formatDateTime } from "@/lib/utils";
import type { InquiryDetail } from "@/lib/services/inquiries";

type Row = InquiryDetail;

const statuses = ["new", "contacted", "qualified", "converted", "archived"] as const;

const tone = {
  new: "accent",
  contacted: "warning",
  qualified: "success",
  converted: "success",
  archived: "muted",
} as const;

function toCsv(rows: Row[]) {
  const header = ["name", "email", "company", "project_type", "budget", "timeline", "status", "created_at"];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const lines = rows.map((row) =>
    [
      row.name,
      row.email,
      row.company ?? "",
      row.projectType ?? "",
      row.budgetRange ?? "",
      row.timeline ?? "",
      row.status,
      row.createdAt.toISOString(),
    ]
      .map(escape)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

export function InquiryTable({ initial }: { initial: Row[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(initial[0]?.id ?? null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const open = useMemo(() => rows.find((row) => row.id === openId) ?? null, [rows, openId]);

  function setStatus(id: string, status: string) {
    startTransition(async () => {
      const formData = csrfFormData();
      formData.set("id", id);
      formData.set("status", status);
      const result = await updateInquiryStatusAction(formData);
      if (result.ok) {
        setRows((current) =>
          current.map((row) => (row.id === id ? { ...row, status, isRead: true } : row)),
        );
        toast.success(`Marked ${status}`);
      } else {
        toast.error("Could not update", result.error);
      }
    });
  }

  function addNote(id: string) {
    const body = noteDrafts[id] ?? "";
    startTransition(async () => {
      const formData = csrfFormData();
      formData.set("id", id);
      formData.set("body", body);
      const result = await addInquiryNoteAction(formData);
      if (result.ok) {
        setRows((current) =>
          current.map((row) =>
            row.id === id
              ? { ...row, notes: [{ id: result.data.id, body, createdAt: new Date() }, ...row.notes] }
              : row,
          ),
        );
        setNoteDrafts((current) => ({ ...current, [id]: "" }));
        toast.success("Note added");
      } else {
        toast.error("Could not add note", result.error);
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const formData = csrfFormData();
      formData.set("id", id);
      const result = await deleteInquiryAction(formData);
      if (result.ok) {
        setRows((current) => current.filter((row) => row.id !== id));
        if (openId === id) setOpenId(null);
        toast.success("Inquiry deleted");
      } else {
        toast.error("Could not delete", result.error);
      }
    });
  }

  function markAllRead() {
    startTransition(async () => {
      const result = await markAllReadAction(csrfFormData());
      if (result.ok) {
        setRows((current) => current.map((row) => ({ ...row, isRead: true })));
        toast.success("All inquiries marked as read");
      } else {
        toast.error("Could not update", result.error);
      }
    });
  }

  function exportCsv() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="border border-line bg-card/40">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim">
            {rows.length} shown · {rows.filter((row) => !row.isRead).length} unread
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={markAllRead}
              disabled={pending}
              className="h-7 border border-line px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-fg-muted hover:text-accent disabled:opacity-50"
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-7 items-center gap-1.5 border border-line px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-fg-muted hover:text-accent"
            >
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-fg-muted">No inquiries in this view.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(row.id)}
                  className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-ink-soft/60 ${
                    openId === row.id ? "bg-ink-soft/80" : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 ${
                      row.isRead ? "bg-fg-dim/40" : "bg-accent"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-display text-[12.5px] uppercase tracking-[0.06em] text-fg">
                        {row.name}
                      </span>
                      <Badge tone={tone[row.status as keyof typeof tone] ?? "muted"}>{row.status}</Badge>
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-fg-muted">{row.message}</span>
                    <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-fg-dim">
                      {formatDateTime(row.createdAt)}
                      {row.projectType ? ` · ${row.projectType}` : ""}
                      {row.budgetRange ? ` · ${row.budgetRange}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="xl:sticky xl:top-4 xl:self-start">
        {open ? (
          <div className="border border-line bg-card/40">
            <div className="border-b border-line px-4 py-3">
              <p className="mono-label text-accent">Inquiry</p>
              <p className="mt-1 font-display text-base uppercase tracking-[0.06em] text-fg">{open.name}</p>
              <a
                href={`mailto:${open.email}`}
                className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10.5px] text-fg-muted hover:text-accent"
              >
                <Mail className="h-3 w-3" /> {open.email}
              </a>
            </div>

            <div className="space-y-3 p-4">
              <dl className="grid grid-cols-2 gap-px bg-line">
                <div className="bg-card px-2 py-1.5">
                  <dt className="mono-label text-fg-dim">Company</dt>
                  <dd className="mt-0.5 text-[11.5px] text-fg-muted">{open.company ?? "—"}</dd>
                </div>
                <div className="bg-card px-2 py-1.5">
                  <dt className="mono-label text-fg-dim">Timeline</dt>
                  <dd className="mt-0.5 text-[11.5px] text-fg-muted">{open.timeline ?? "—"}</dd>
                </div>
                <div className="bg-card px-2 py-1.5">
                  <dt className="mono-label text-fg-dim">Project type</dt>
                  <dd className="mt-0.5 text-[11.5px] text-fg-muted">{open.projectType ?? "—"}</dd>
                </div>
                <div className="bg-card px-2 py-1.5">
                  <dt className="mono-label text-fg-dim">Budget</dt>
                  <dd className="mt-0.5 text-[11.5px] text-fg-muted">{open.budgetRange ?? "—"}</dd>
                </div>
              </dl>

              <p className="whitespace-pre-line border border-line bg-ink px-3 py-2 text-[12px] leading-relaxed text-fg-muted">
                {open.message}
              </p>

              <div>
                <span className="mono-label text-fg-dim">Status</span>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatus(open.id, status)}
                      disabled={pending}
                      className={`h-7 px-2 font-mono text-[9px] uppercase tracking-[0.1em] ${
                        open.status === status
                          ? "bg-accent text-ink"
                          : "border border-line text-fg-muted hover:text-accent"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Notes" htmlFor="note">
                <Textarea
                  id="note"
                  rows={3}
                  value={noteDrafts[open.id] ?? ""}
                  onChange={(event) =>
                    setNoteDrafts((current) => ({ ...current, [open.id]: event.target.value }))
                  }
                  placeholder="Call summary, next step, quoted scope…"
                />
              </Field>
              <button
                type="button"
                onClick={() => addNote(open.id)}
                disabled={pending || (noteDrafts[open.id] ?? "").trim().length < 2}
                className="inline-flex h-8 items-center gap-2 bg-accent px-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink disabled:opacity-40"
              >
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Add note
              </button>

              {open.notes.length > 0 ? (
                <ul className="space-y-1.5 border-t border-line pt-3">
                  {open.notes.map((note) => (
                    <li key={note.id} className="border-l border-accent/40 pl-2.5">
                      <p className="text-[11.5px] leading-relaxed text-fg-muted">{note.body}</p>
                      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-fg-dim">
                        {formatDateTime(note.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="flex items-center justify-between border-t border-line pt-3">
                <a
                  href={`mailto:${open.email}?subject=Re: your project inquiry`}
                  className="inline-flex h-8 items-center gap-1.5 border border-line px-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-muted hover:text-accent"
                >
                  <Mail className="h-3 w-3" /> Reply
                </a>
                <button
                  type="button"
                  onClick={() => remove(open.id)}
                  className="inline-flex h-8 items-center gap-1.5 border border-line px-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-muted hover:border-red-500/50 hover:text-red-300"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="border border-dashed border-line px-4 py-12 text-center text-sm text-fg-muted">
            Select an inquiry to see the details.
          </p>
        )}
      </aside>
    </div>
  );
}

"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Copy, Loader2, Search, Trash2, Upload } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { csrfFormData } from "@/components/admin/studio";
import { deleteMediaAction, updateMediaAction, uploadMediaAction } from "@/lib/actions/media";
import type { MediaAsset } from "@/lib/services/media";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({ initial }: { initial: MediaAsset[] }) {
  const toast = useToast();
  const [assets, setAssets] = useState(initial);
  const [filter, setFilter] = useState<"all" | "image" | "document">("all");
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (filter !== "all" && asset.kind !== filter) return false;
      if (!term) return true;
      return (
        asset.originalName.toLowerCase().includes(term) ||
        (asset.alt ?? "").toLowerCase().includes(term)
      );
    });
  }, [assets, filter, search]);

  function upload(files: FileList | null) {
    if (!files || files.length === 0) return;

    startTransition(async () => {
      let uploaded = 0;
      for (const file of Array.from(files)) {
        const formData = csrfFormData();
        formData.set("file", file);
        const result = await uploadMediaAction(formData);

        if (!result.ok) {
          toast.error(`Upload failed: ${file.name}`, result.error);
          continue;
        }

        uploaded += 1;
        if (result.data.duplicate) {
          toast.info(`${file.name} already exists`);
        }
      }

      if (uploaded > 0) {
        toast.success(`${uploaded} file${uploaded === 1 ? "" : "s"} uploaded`);
        const response = await fetch("/api/admin/media", { cache: "no-store" });
        if (response.ok) {
          const data = (await response.json()) as { assets: MediaAsset[] };
          setAssets(data.assets);
        }
      }

      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function remove(asset: MediaAsset) {
    startTransition(async () => {
      const formData = csrfFormData();
      formData.set("id", asset.id);
      const result = await deleteMediaAction(formData);
      if (result.ok) {
        setAssets((current) => current.filter((entry) => entry.id !== asset.id));
        toast.success("Asset deleted");
      } else {
        toast.error("Could not delete", result.error);
      }
    });
  }

  function saveAlt(asset: MediaAsset) {
    startTransition(async () => {
      const formData = csrfFormData();
      formData.set("payload", JSON.stringify({ id: asset.id, alt: altDrafts[asset.id] ?? "" }));
      const result = await updateMediaAction(formData);
      if (result.ok) {
        setAssets((current) =>
          current.map((entry) =>
            entry.id === asset.id ? { ...entry, alt: altDrafts[asset.id] || null } : entry,
          ),
        );
        setEditing(null);
        toast.success("Alt text saved");
      } else {
        toast.error("Could not save", result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-card/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "image", "document"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`h-8 px-3 font-mono text-[10px] uppercase tracking-[0.14em] ${
                filter === value
                  ? "bg-accent text-ink"
                  : "border border-line text-fg-muted hover:border-accent/60 hover:text-accent"
              }`}
            >
              {value}
            </button>
          ))}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-fg-dim" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assets"
              aria-label="Search assets"
              className="h-8 w-56 border border-line bg-ink pl-7 pr-2 text-[12px] text-fg placeholder:text-fg-dim focus:border-accent/70 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
            onChange={(event) => upload(event.target.files)}
            className="hidden"
            aria-hidden
            tabIndex={-1}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
            className="inline-flex h-8 items-center gap-2 bg-accent px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Upload
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="border border-dashed border-line px-6 py-16 text-center text-sm text-fg-muted">
          No assets yet. Upload a JPEG, PNG, WebP, AVIF or PDF up to 8 MB.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((asset) => (
            <li key={asset.id} className="border border-line bg-card/40">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-soft">
                {asset.kind === "image" ? (
                  <Image
                    src={asset.url}
                    alt={asset.alt ?? asset.originalName}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-cover"
                    unoptimized={asset.url.startsWith("/uploads/")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim">
                    PDF document
                  </div>
                )}
              </div>

              <div className="space-y-2 p-3">
                <p className="truncate font-mono text-[10.5px] text-fg" title={asset.originalName}>
                  {asset.originalName}
                </p>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-dim">
                  {formatBytes(asset.sizeBytes)}
                  {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
                </p>

                {editing === asset.id ? (
                  <Field label="Alt text" htmlFor={`alt-${asset.id}`}>
                    <Input
                      id={`alt-${asset.id}`}
                      value={altDrafts[asset.id] ?? ""}
                      onChange={(event) =>
                        setAltDrafts((current) => ({ ...current, [asset.id]: event.target.value }))
                      }
                      maxLength={220}
                    />
                  </Field>
                ) : (
                  <p className="min-h-8 text-[11px] leading-snug text-fg-muted">
                    {asset.alt ?? <span className="text-red-400/80">Missing alt text</span>}
                  </p>
                )}

                <div className="flex items-center gap-1">
                  {editing === asset.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => saveAlt(asset)}
                        className="h-7 bg-accent px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="h-7 border border-line px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-fg-muted"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(asset.id);
                          setAltDrafts((current) => ({ ...current, [asset.id]: asset.alt ?? "" }));
                        }}
                        className="h-7 border border-line px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-fg-muted hover:text-accent"
                      >
                        Alt
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(asset.url);
                          toast.success("URL copied");
                        }}
                        aria-label={`Copy URL for ${asset.originalName}`}
                        className="inline-flex h-7 w-7 items-center justify-center border border-line text-fg-muted hover:text-accent"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(asset)}
                        aria-label={`Delete ${asset.originalName}`}
                        className="inline-flex h-7 w-7 items-center justify-center border border-line text-fg-muted hover:border-red-500/50 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

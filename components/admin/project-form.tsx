"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { csrfFormData, StudioSectionHeader } from "@/components/admin/studio";
import { createProjectAction, deleteProjectAction, updateProjectAction } from "@/lib/actions/projects";
import { projectFormSchema } from "@/lib/validations/project";

type Technology = { id: string; name: string };

export type ProjectDraft = {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  problem: string;
  architecture: string;
  solution: string;
  outcome: string;
  features: string[];
  stage: string;
  status: string;
  isFeatured: boolean;
  coverImageUrl: string;
  architectureImageUrl: string;
  demoUrl: string;
  repoUrl: string;
  seoTitle: string;
  seoDescription: string;
  technologyIds: string[];
  gallery: { url: string; alt: string; caption: string }[];
};

export const emptyProject: ProjectDraft = {
  title: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  problem: "",
  architecture: "",
  solution: "",
  outcome: "",
  features: [],
  stage: "in-development",
  status: "draft",
  isFeatured: false,
  coverImageUrl: "",
  architectureImageUrl: "",
  demoUrl: "",
  repoUrl: "",
  seoTitle: "",
  seoDescription: "",
  technologyIds: [],
  gallery: [],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ProjectForm({
  mode,
  initial,
  projectId,
  technologies,
  mediaUrls,
}: {
  mode: "create" | "edit";
  initial: ProjectDraft;
  projectId?: string;
  technologies: Technology[];
  mediaUrls: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<ProjectDraft>(initial);
  const [featuresText, setFeaturesText] = useState(initial.features.join("\n"));
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const patch = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  function payload() {
    return {
      ...form,
      features: featuresText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };
  }

  function submit() {
    const candidate = payload();
    const parsed = projectFormSchema.safeParse(candidate);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
      }
      setErrors(fieldErrors);
      toast.error("Check the highlighted fields");
      return;
    }

    setErrors({});

    startTransition(async () => {
      const formData = csrfFormData();
      formData.set("payload", JSON.stringify(parsed.data));
      if (mode === "edit" && projectId) formData.set("id", projectId);

      const result =
        mode === "create" ? await createProjectAction(formData) : await updateProjectAction(formData);

      if (result.ok) {
        toast.success(mode === "create" ? "Project created" : "Project saved");
        if (mode === "create") {
          router.push(`/admin/projects/${result.data.id}`);
        } else {
          router.refresh();
        }
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error("Could not save", result.error);
      }
    });
  }

  function remove() {
    if (!projectId) return;
    startTransition(async () => {
      const formData = csrfFormData();
      formData.set("id", projectId);
      const result = await deleteProjectAction(formData);
      if (result.ok) {
        toast.success("Project deleted");
        router.push("/admin/projects");
      } else {
        toast.error("Could not delete", result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim hover:text-accent"
        >
          <ArrowLeft className="h-3 w-3" /> All projects
        </Link>
        <div className="flex items-center gap-2">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex h-9 items-center gap-2 border border-line px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted hover:border-red-500/50 hover:text-red-300 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          ) : null}
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex h-9 items-center gap-2 bg-accent px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {mode === "create" ? "Create project" : "Save changes"}
          </button>
        </div>
      </div>

      <section className="border border-line bg-card/40">
        <div className="px-4 pt-4">
          <StudioSectionHeader title="Identity" description="Title, slug and the short summary used in listings." />
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="title" required error={errors.title?.[0]}>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => {
                patch("title", event.target.value);
                if (mode === "create") patch("slug", slugify(event.target.value));
              }}
            />
          </Field>
          <Field label="Slug" htmlFor="slug" required hint="/work/<slug>" error={errors.slug?.[0]}>
            <Input id="slug" value={form.slug} onChange={(event) => patch("slug", slugify(event.target.value))} />
          </Field>
          <Field
            label="Short description"
            htmlFor="shortDescription"
            required
            className="sm:col-span-2"
            error={errors.shortDescription?.[0]}
          >
            <Textarea
              id="shortDescription"
              rows={2}
              maxLength={320}
              value={form.shortDescription}
              onChange={(event) => patch("shortDescription", event.target.value)}
            />
          </Field>
          <Field label="Stage" htmlFor="stage">
            <Select
              id="stage"
              value={form.stage}
              onChange={(event) => patch("stage", event.target.value)}
              options={[
                { value: "live", label: "Live" },
                { value: "in-development", label: "In development" },
                { value: "concept", label: "Concept" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </Field>
          <Field label="Status" htmlFor="status" hint="Only published projects appear on the site.">
            <Select
              id="status"
              value={form.status}
              onChange={(event) => patch("status", event.target.value)}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </Field>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => patch("isFeatured", event.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--color-accent)]"
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">
              Feature on the homepage
            </span>
          </label>
        </div>
      </section>

      <section className="border border-line bg-card/40">
        <div className="px-4 pt-4">
          <StudioSectionHeader
            title="Case study"
            description="Written as an engineering record: problem, architecture, what was built, outcome."
          />
        </div>
        <div className="grid gap-3 p-4">
          <Field label="Overview" htmlFor="fullDescription" required error={errors.fullDescription?.[0]}>
            <Textarea
              id="fullDescription"
              rows={4}
              value={form.fullDescription}
              onChange={(event) => patch("fullDescription", event.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Problem" htmlFor="problem">
              <Textarea id="problem" rows={3} value={form.problem} onChange={(event) => patch("problem", event.target.value)} />
            </Field>
            <Field label="Architecture" htmlFor="architecture">
              <Textarea
                id="architecture"
                rows={3}
                value={form.architecture}
                onChange={(event) => patch("architecture", event.target.value)}
              />
            </Field>
            <Field label="Implementation" htmlFor="solution">
              <Textarea id="solution" rows={3} value={form.solution} onChange={(event) => patch("solution", event.target.value)} />
            </Field>
            <Field label="Outcome" htmlFor="outcome" hint="Only state measurable results you can back up.">
              <Textarea id="outcome" rows={3} value={form.outcome} onChange={(event) => patch("outcome", event.target.value)} />
            </Field>
          </div>
          <Field label="Capabilities" htmlFor="features" hint="One per line.">
            <Textarea
              id="features"
              rows={4}
              value={featuresText}
              onChange={(event) => setFeaturesText(event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="border border-line bg-card/40">
        <div className="px-4 pt-4">
          <StudioSectionHeader title="Media" description="Paths from the media library, or any absolute URL." />
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label="Cover image" htmlFor="coverImageUrl">
            <Input
              id="coverImageUrl"
              value={form.coverImageUrl}
              list="media-urls"
              onChange={(event) => patch("coverImageUrl", event.target.value)}
              placeholder="/uploads/cover.jpg"
            />
          </Field>
          <Field label="Architecture diagram" htmlFor="architectureImageUrl">
            <Input
              id="architectureImageUrl"
              value={form.architectureImageUrl}
              list="media-urls"
              onChange={(event) => patch("architectureImageUrl", event.target.value)}
              placeholder="/uploads/diagram.png"
            />
          </Field>
          <datalist id="media-urls">
            {mediaUrls.map((url) => (
              <option key={url} value={url} />
            ))}
          </datalist>

          <div className="sm:col-span-2">
            <StudioSectionHeader title="Gallery" />
            <div className="mt-3 space-y-2">
              {form.gallery.map((image, index) => (
                <div key={index} className="grid gap-2 border border-line p-2 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
                  <Input
                    value={image.url}
                    list="media-urls"
                    placeholder="Image URL"
                    aria-label={`Gallery image ${index + 1} URL`}
                    onChange={(event) =>
                      patch(
                        "gallery",
                        form.gallery.map((entry, i) => (i === index ? { ...entry, url: event.target.value } : entry)),
                      )
                    }
                  />
                  <Input
                    value={image.alt}
                    placeholder="Alt text"
                    aria-label={`Gallery image ${index + 1} alt text`}
                    onChange={(event) =>
                      patch(
                        "gallery",
                        form.gallery.map((entry, i) => (i === index ? { ...entry, alt: event.target.value } : entry)),
                      )
                    }
                  />
                  <Input
                    value={image.caption}
                    placeholder="Caption"
                    aria-label={`Gallery image ${index + 1} caption`}
                    onChange={(event) =>
                      patch(
                        "gallery",
                        form.gallery.map((entry, i) => (i === index ? { ...entry, caption: event.target.value } : entry)),
                      )
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Remove gallery image ${index + 1}`}
                    onClick={() => patch("gallery", form.gallery.filter((_, i) => i !== index))}
                    className="inline-flex h-10 w-10 items-center justify-center border border-line text-fg-muted hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => patch("gallery", [...form.gallery, { url: "", alt: "", caption: "" }])}
                className="inline-flex h-8 items-center gap-2 border border-line px-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-muted hover:text-accent"
              >
                <Plus className="h-3 w-3" /> Add image
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border border-line bg-card/40">
        <div className="px-4 pt-4">
          <StudioSectionHeader title="Technology & links" />
        </div>
        <div className="grid gap-3 p-4">
          <div>
            <span className="mono-label text-fg-dim">Technologies</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {technologies.map((technology) => {
                const active = form.technologyIds.includes(technology.id);
                return (
                  <button
                    key={technology.id}
                    type="button"
                    onClick={() =>
                      patch(
                        "technologyIds",
                        active
                          ? form.technologyIds.filter((id) => id !== technology.id)
                          : [...form.technologyIds, technology.id],
                      )
                    }
                    className={`h-7 px-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] ${
                      active ? "bg-accent text-ink" : "border border-line text-fg-muted hover:text-accent"
                    }`}
                  >
                    {technology.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Demo URL" htmlFor="demoUrl" error={errors.demoUrl?.[0]}>
              <Input id="demoUrl" value={form.demoUrl} onChange={(event) => patch("demoUrl", event.target.value)} />
            </Field>
            <Field label="Repository URL" htmlFor="repoUrl" error={errors.repoUrl?.[0]}>
              <Input id="repoUrl" value={form.repoUrl} onChange={(event) => patch("repoUrl", event.target.value)} />
            </Field>
          </div>
        </div>
      </section>

      <section className="border border-line bg-card/40">
        <div className="px-4 pt-4">
          <StudioSectionHeader title="Search preview" description="Falls back to the title and short description." />
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label="SEO title" htmlFor="seoTitle">
            <Input
              id="seoTitle"
              value={form.seoTitle}
              maxLength={200}
              onChange={(event) => patch("seoTitle", event.target.value)}
            />
          </Field>
          <Field label="SEO description" htmlFor="seoDescription">
            <Textarea
              id="seoDescription"
              rows={3}
              maxLength={320}
              value={form.seoDescription}
              onChange={(event) => patch("seoDescription", event.target.value)}
            />
          </Field>
          <div className="border border-line px-3 py-2 sm:col-span-2">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-dim">Google preview</p>
            <p className="mt-1 text-[13px] text-blue-300">
              {form.seoTitle || form.title || "Untitled project"}
            </p>
            <p className="text-[11px] text-emerald-400/80">yourdomain.dev/work/{form.slug || "slug"}</p>
            <p className="mt-0.5 line-clamp-2 text-[11.5px] text-fg-muted">
              {form.seoDescription || form.shortDescription || "Add a short description."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

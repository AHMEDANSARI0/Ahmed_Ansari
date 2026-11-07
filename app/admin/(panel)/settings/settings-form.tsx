"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { updateSiteSettingsAction } from "@/lib/actions/settings";
import type { SiteSettingsValue, SocialLinkValue } from "@/lib/config/site";
import { CSRF_FIELD } from "@/lib/csrf-constants";

const availabilityOptions = [
  { value: "available", label: "Available for projects" },
  { value: "limited", label: "Limited availability" },
  { value: "unavailable", label: "Not accepting projects" },
];

const platformOptions = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "github", label: "GitHub" },
  { value: "email", label: "Email" },
  { value: "x", label: "X" },
  { value: "website", label: "Website" },
  { value: "upwork", label: "Upwork" },
];

const localeOptions = [
  { value: "en", label: "English" },
  { value: "ur", label: "Roman Urdu" },
];

export function SettingsForm({ initial }: { initial: SiteSettingsValue }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<SiteSettingsValue>(initial);

  const update = <K extends keyof SiteSettingsValue>(key: K, value: SiteSettingsValue[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const updateLink = (index: number, patch: Partial<SocialLinkValue>) =>
    setForm((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    }));

  const save = () => {
    startTransition(async () => {
      const formData = new FormData();
      const csrf = document.cookie
        .split(";")
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith("aa_csrf="))
        ?.slice("aa_csrf=".length);
      formData.set(CSRF_FIELD, decodeURIComponent(csrf ?? ""));
      formData.set("payload", JSON.stringify(form));
      const result = await updateSiteSettingsAction(formData);
      if (result.ok) toast.success("Settings saved");
      else toast.error("Could not save", result.error);
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Site name" htmlFor="siteName" required>
          <Input
            id="siteName"
            value={form.siteName}
            onChange={(event) => update("siteName", event.target.value)}
          />
        </Field>
        <Field label="Professional title" htmlFor="role" required>
          <Input id="role" value={form.role} onChange={(event) => update("role", event.target.value)} />
        </Field>
        <Field label="Logo text" htmlFor="logoText" hint="Rendered uppercase in the header.">
          <Input
            id="logoText"
            value={form.logoText}
            onChange={(event) => update("logoText", event.target.value)}
          />
        </Field>
        <Field label="Domain" htmlFor="domain" hint="Used for canonical URLs and sitemap.">
          <Input id="domain" value={form.domain} onChange={(event) => update("domain", event.target.value)} />
        </Field>
        <Field label="Contact email" htmlFor="email">
          <Input id="email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
        </Field>
        <Field label="Location" htmlFor="location">
          <Input
            id="location"
            value={form.location}
            onChange={(event) => update("location", event.target.value)}
          />
        </Field>
        <Field label="Timezone" htmlFor="timezone">
          <Input
            id="timezone"
            value={form.timezone}
            onChange={(event) => update("timezone", event.target.value)}
          />
        </Field>
        <Field label="Default language" htmlFor="locale">
          <Select
            id="locale"
            options={localeOptions}
            value={form.locale}
            onChange={(event) => update("locale", event.target.value as SiteSettingsValue["locale"])}
          />
        </Field>
        <Field label="Copyright" htmlFor="copyright" className="md:col-span-2 xl:col-span-1">
          <Input
            id="copyright"
            value={form.copyright}
            onChange={(event) => update("copyright", event.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 border-t border-line pt-5 md:grid-cols-2">
        <Field label="Availability status" htmlFor="availabilityState">
          <Select
            id="availabilityState"
            options={availabilityOptions}
            value={form.availability.state}
            onChange={(event) =>
              update("availability", {
                ...form.availability,
                state: event.target.value as SiteSettingsValue["availability"]["state"],
              })
            }
          />
        </Field>
        <Field label="Availability message" htmlFor="availabilityMessage">
          <Input
            id="availabilityMessage"
            value={form.availability.message}
            onChange={(event) =>
              update("availability", { ...form.availability, message: event.target.value })
            }
          />
        </Field>
        <Field label="Footer tagline" htmlFor="footerTagline" className="md:col-span-2">
          <Textarea
            id="footerTagline"
            rows={2}
            value={form.footer.tagline}
            onChange={(event) => update("footer", { ...form.footer, tagline: event.target.value })}
          />
        </Field>
        <Field label="CV file URL" htmlFor="cvUrl" hint="Upload the PDF in the media library in a later phase.">
          <Input
            id="cvUrl"
            value={form.cv.fileUrl ?? ""}
            onChange={(event) =>
              update("cv", { ...form.cv, fileUrl: event.target.value || null })
            }
          />
        </Field>
        <Field label="CV button label" htmlFor="cvLabel">
          <Input
            id="cvLabel"
            value={form.cv.label}
            onChange={(event) => update("cv", { ...form.cv, label: event.target.value })}
          />
        </Field>
      </div>

      <div className="border-t border-line pt-3">
        <Switch
          label="Availability indicator visible"
          description="Show the status pill on the public site."
          checked={form.availability.showIndicator}
          onChange={(value) => update("availability", { ...form.availability, showIndicator: value })}
        />
        <Switch
          label="CV download enabled"
          description="Only enable once a real PDF is uploaded."
          checked={form.cv.enabled}
          onChange={(value) => update("cv", { ...form.cv, enabled: value })}
        />
        <Switch
          label="Maintenance mode"
          description="Public pages render a maintenance screen. Admin stays reachable."
          checked={form.maintenanceMode}
          onChange={(value) => update("maintenanceMode", value)}
        />
      </div>

      <div className="border-t border-line pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
            Social profiles
          </h3>
          <button
            type="button"
            onClick={() =>
              update("socialLinks", [
                ...form.socialLinks,
                { platform: "website", label: "Website", url: "https://", visible: true },
              ])
            }
            className="flex items-center gap-1.5 border border-line px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted hover:border-accent/50 hover:text-accent"
          >
            <Plus className="h-3 w-3" /> Add link
          </button>
        </div>

        <div className="space-y-2">
          {form.socialLinks.map((link, index) => (
            <div
              key={`${link.platform}-${index}`}
              className="grid items-end gap-2 border border-line bg-ink/60 p-2.5 sm:grid-cols-[130px_1fr_1fr_auto_auto]"
            >
              <Select
                options={platformOptions}
                value={link.platform}
                onChange={(event) =>
                  updateLink(index, {
                    platform: event.target.value as SocialLinkValue["platform"],
                  })
                }
              />
              <Input
                value={link.label}
                onChange={(event) => updateLink(index, { label: event.target.value })}
                placeholder="Label"
              />
              <Input
                value={link.url}
                onChange={(event) => updateLink(index, { url: event.target.value })}
                placeholder="https://"
              />
              <button
                type="button"
                onClick={() => updateLink(index, { visible: !link.visible })}
                className={`h-10 border px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
                  link.visible
                    ? "border-emerald-500/40 text-emerald-300"
                    : "border-line text-fg-dim"
                }`}
              >
                {link.visible ? "shown" : "hidden"}
              </button>
              <button
                type="button"
                onClick={() =>
                  update(
                    "socialLinks",
                    form.socialLinks.filter((_, i) => i !== index),
                  )
                }
                aria-label="Remove link"
                className="flex h-10 w-10 items-center justify-center border border-line text-fg-dim hover:border-red-500/40 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {form.socialLinks.length === 0 ? (
            <p className="border border-dashed border-line px-3 py-6 text-center text-[12px] text-fg-dim">
              No social profiles configured.
            </p>
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-line bg-ink/90 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => setForm(initial)}
          disabled={pending}
          className="h-10 border border-line px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted hover:border-line hover:text-fg disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex h-10 items-center gap-2 bg-accent px-5 mono-label text-ink hover:bg-accent/90 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save changes
        </button>
      </div>
    </div>
  );
}

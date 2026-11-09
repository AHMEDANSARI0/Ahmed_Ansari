"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, Mail, MapPin, Send } from "lucide-react";
import { submitInquiryAction } from "@/lib/actions/contact";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SectionShell } from "@/components/sections/section-shell-client";
import type { AnimationConfig, AnimationType } from "@/lib/config/animation";
import type { ContactContent } from "@/lib/config/sections";
import type { SectionRecord } from "@/lib/services/content";
import type { SiteSettingsValue } from "@/lib/config/site";
import type { ActionResult } from "@/types";

function toOptions(values: string[], placeholder: string) {
  return [{ value: "", label: placeholder }, ...values.map((value) => ({ value, label: value }))];
}

export function Contact({
  section,
  content,
  animation,
  sectionType,
  settings,
}: {
  section?: SectionRecord;
  content: ContactContent;
  animation: AnimationConfig;
  sectionType?: AnimationType;
  settings: SiteSettingsValue;
}) {
  const [state, formAction, pending] = useActionState<ActionResult<{ id: string }> | null, FormData>(
    async (_previous, formData) => submitInquiryAction(formData),
    null,
  );

  const [clientErrors, setClientErrors] = useState<Record<string, string[]>>({});
  const serverErrors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const errors = { ...serverErrors, ...clientErrors };

  function validate(formData: FormData) {
    const found: Record<string, string[]> = {};
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (name.length < 2) found.name = ["Enter your name."];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) found.email = ["Enter a valid email address."];
    if (message.length < 20) found.message = ["Describe the project in at least 20 characters."];

    setClientErrors(found);
    return Object.keys(found).length === 0;
  }

  return (
    <SectionShell
      id="contact"
      eyebrow={section?.eyebrow ?? "CONTACT"}
      heading={section?.heading ?? "Let's build something"}
      description={section?.description}
      animation={animation}
      animationType={sectionType}
    >
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="flex flex-col justify-between">
          <div>


            <ul className="mt-8 space-y-3">
              <li className="flex items-center gap-3 border border-line px-3 py-2.5">
                <Mail className="h-3.5 w-3.5 text-accent" />
                <a
                  href={`mailto:${settings.email}`}
                  className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted hover:text-accent"
                >
                  {settings.email}
                </a>
              </li>
              <li className="flex items-center gap-3 border border-line px-3 py-2.5">
                <MapPin className="h-3.5 w-3.5 text-accent" />
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">
                  {settings.location} · {settings.timezone}
                </span>
              </li>
            </ul>

            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim">
              {content.responseTime}
            </p>
          </div>

          <div className="mt-8 border-l border-accent/50 pl-4">
            <p className="mono-label text-fg-dim">Response policy</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-fg-muted">
              Every inquiry is stored in the owner dashboard first. Reply happens by email,
              from a real mailbox you can reply to.
            </p>
          </div>
        </div>

        <div className="border border-line bg-card/40 p-5 sm:p-7">
          {state?.ok ? (
            <div className="flex flex-col items-start gap-3 py-10">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <h3 className="font-display text-xl font-semibold uppercase tracking-wide">
                Inquiry received
              </h3>
              <p className="max-w-md text-[13px] leading-relaxed text-fg-muted">
                It is saved in the owner dashboard with a reference id{" "}
                <span className="font-mono text-accent">{state.data.id.slice(0, 8)}</span>. You will
                get a reply at the email you provided.
              </p>
              <a
                href="#home"
                className="mt-2 inline-flex h-10 items-center border border-line px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted hover:border-accent/60 hover:text-accent"
              >
                Back to top
              </a>
            </div>
          ) : (
            <form
              action={formAction}
              noValidate
              onSubmit={(event) => {
                if (!validate(new FormData(event.currentTarget))) event.preventDefault();
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="name" required error={errors.name?.[0]}>
                  <Input id="name" name="name" autoComplete="name" required maxLength={120} />
                </Field>
                <Field label="Email" htmlFor="email" required error={errors.email?.[0]}>
                  <Input id="email" name="email" type="email" autoComplete="email" required />
                </Field>
                <Field label="Company" htmlFor="company" hint="Optional" error={errors.company?.[0]}>
                  <Input id="company" name="company" autoComplete="organization" maxLength={160} />
                </Field>
                <Field label="Project type" htmlFor="projectType" error={errors.projectType?.[0]}>
                  <Select
                    id="projectType"
                    name="projectType"
                    options={toOptions(content.projectTypes, "Select type")}
                  />
                </Field>
                <Field label="Budget range" htmlFor="budgetRange" hint="Optional">
                  <Select
                    id="budgetRange"
                    name="budgetRange"
                    options={toOptions(content.budgetRanges, "Select range")}
                  />
                </Field>
                <Field label="Timeline" htmlFor="timeline" hint="Optional">
                  <Select
                    id="timeline"
                    name="timeline"
                    options={toOptions(content.timelines, "Select timeline")}
                  />
                </Field>
              </div>

              <Field
                label="Project description"
                htmlFor="message"
                required
                hint="What is manual today, and what should happen instead?"
                error={errors.message?.[0]}
              >
                <Textarea id="message" name="message" rows={6} required maxLength={4000} />
              </Field>

              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="website">Website</label>
                <input id="website" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              {state && !state.ok ? (
                <p className="border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12px] text-red-300">
                  {state.error}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-fg-dim">
                  Validated and stored server-side
                </p>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-11 items-center gap-2 angular-clip bg-accent px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ink transition-colors hover:bg-accent/90 disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {pending ? "Sending" : "Send inquiry"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

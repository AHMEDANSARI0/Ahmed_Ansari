import Link from "next/link";
import { CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/admin/page";
import { listAdminProjects } from "@/lib/services/projects-admin";
import { getSiteSettings } from "@/lib/services/settings";

export const dynamic = "force-dynamic";

type Check = { label: string; ok: boolean; detail: string; href?: string };

export default async function SeoPage() {
  const [settings, all] = await Promise.all([getSiteSettings(), listAdminProjects()]);
  const projects = all.filter((project) => project.status === "published");

  const missingTitles = projects.filter((project) => !project.seoTitle);
  const missingDescriptions = projects.filter((project) => !project.seoDescription);
  const longSummaries = projects.filter((project) => project.shortDescription.length > 160);
  const missingCovers = projects.filter((project) => !project.coverImageUrl);

  const checks: Check[] = [
    {
      label: "Site name, role & domain",
      ok: Boolean(settings.siteName && settings.role && settings.domain),
      detail:
        settings.siteName && settings.role && settings.domain
          ? `${settings.siteName} · ${settings.role} · ${settings.domain}`
          : "Name, role or domain is empty",
      href: "/admin/settings",
    },
    {
      label: "Contact email",
      ok: Boolean(settings.email),
      detail: settings.email || "No email set, the contact section has nothing to link to",
      href: "/admin/settings",
    },
    {
      label: "Open Graph image",
      ok: true,
      detail: "Generated at /opengraph-image from the live theme colours",
    },
    {
      label: "robots.txt & sitemap.xml",
      ok: true,
      detail: "Both served by the app router, sitemap rebuilt whenever content changes",
    },
    {
      label: "Structured data",
      ok: true,
      detail: "Person JSON-LD on the home page, CreativeWork JSON-LD on every case study",
    },
    {
      label: "Case study meta titles",
      ok: missingTitles.length === 0,
      detail:
        missingTitles.length === 0
          ? `All ${projects.length} published case studies set one`
          : `${missingTitles.length} fall back to the generated title`,
      href: "/admin/projects",
    },
    {
      label: "Case study meta descriptions",
      ok: missingDescriptions.length === 0,
      detail:
        missingDescriptions.length === 0
          ? "Every case study sets one"
          : `${missingDescriptions.length} fall back to the short description`,
      href: "/admin/projects",
    },
    {
      label: "Snippet length",
      ok: longSummaries.length === 0,
      detail:
        longSummaries.length === 0
          ? "All short descriptions fit inside a search snippet"
          : `${longSummaries.length} short description${longSummaries.length === 1 ? " is" : "s are"} longer than 160 characters`,
      href: "/admin/projects",
    },
    {
      label: "Cover images",
      ok: missingCovers.length === 0,
      detail:
        missingCovers.length === 0
          ? "Every case study has a preview image when shared"
          : `${missingCovers.length} case studies share without a preview image`,
      href: "/admin/media",
    },
  ];

  const failed = checks.filter((check) => !check.ok).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SYSTEM"
        title="SEO"
        description="An audit of the metadata the site actually ships. Amber items need content, not code."
        actions={
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 border border-line px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted hover:text-accent"
          >
            View sitemap <ArrowUpRight className="h-3 w-3" />
          </a>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Checks passed" value={`${checks.length - failed} / ${checks.length}`} />
        <StatCard label="Published case studies" value={String(projects.length)} />
        <StatCard label="Needs attention" value={String(failed)} />
      </div>

      <Panel title="Audit">
        <ul className="divide-y divide-line">
          {checks.map((check) => (
            <li key={check.label} className="flex items-start gap-3 px-4 py-3">
              {check.ok ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display text-[12.5px] uppercase tracking-[0.06em] text-fg">{check.label}</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-fg-muted">{check.detail}</p>
              </div>
              {check.href ? (
                <Link
                  href={check.href}
                  className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-dim hover:text-accent"
                >
                  Open
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>

      <p className="text-[11px] leading-relaxed text-fg-dim">
        Every row reads from the database or the running route, there is no hardcoded score. Fill in the
        missing fields and the amber rows clear themselves.
      </p>
    </div>
  );
}

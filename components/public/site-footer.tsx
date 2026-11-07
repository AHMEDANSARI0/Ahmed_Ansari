import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { SiteSettingsValue } from "@/lib/config/site";
import type { NavItem } from "@/components/public/site-header";

export function SiteFooter({
  settings,
  navItems,
}: {
  settings: SiteSettingsValue;
  navItems: NavItem[];
}) {
  const year = new Date().getFullYear();
  const socials = settings.socialLinks.filter((link) => link.visible);

  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-6 w-6 items-center justify-center">
                <span className="absolute inset-0 rotate-45 border border-accent/70" />
                <span className="h-1.5 w-1.5 bg-accent" />
              </span>
              <span className="font-display text-[13px] font-bold uppercase tracking-[0.34em]">
                {settings.logoText}
              </span>
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-fg-muted">
              {settings.footer.tagline}
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-dim">
              {settings.location} · {settings.timezone}
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="mono-label text-fg-dim">Sections</p>
            <ul className="mt-4 space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-[13px] text-fg-muted transition-colors hover:text-accent"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mono-label text-fg-dim">Connect</p>
            <ul className="mt-4 space-y-2">
              {socials.map((link) => (
                <li key={link.platform}>
                  <a
                    href={link.url}
                    target={link.url.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 text-[13px] text-fg-muted transition-colors hover:text-accent"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
            {settings.cv.enabled && settings.cv.fileUrl ? (
              <a
                href={settings.cv.fileUrl}
                className="mt-5 inline-flex h-9 items-center border border-line px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted hover:border-accent/60 hover:text-accent"
              >
                {settings.cv.label}
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim">
            © {year} {settings.siteName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim">
            <span>{settings.availability.message}</span>
            <Link href="/admin/login" className="transition-colors hover:text-accent">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

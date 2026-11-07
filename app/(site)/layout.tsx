import { PatternLayer } from "@/components/background/pattern-layer";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { PageView } from "@/components/analytics/page-view";
import { getSiteSettings, getDesignSettings, getAnimationSettings } from "@/lib/services/settings";
import { getSections, navSections } from "@/lib/services/content";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, design, animation, sections] = await Promise.all([
    getSiteSettings(),
    getDesignSettings(),
    getAnimationSettings(),
    getSections(),
  ]);

  const navItems = navSections(sections).map((section) => ({
    label: section.navLabel ?? section.label,
    href: `#${section.anchor}`,
  }));

  const themeVars = {
    "--color-ink": design.colors.background,
    "--color-ink-soft": design.colors.surface,
    "--color-card": design.colors.card,
    "--color-accent": design.colors.accent,
    "--color-accent-soft": design.colors.accentSoft,
    "--color-fg": design.colors.text,
    "--color-fg-muted": design.colors.textMuted,
    "--color-line": design.colors.border,
    "--font-display":
      design.typography.headingFont === "space-grotesk"
        ? "var(--font-space-grotesk), ui-sans-serif, system-ui"
        : "var(--font-oxanium), var(--font-space-grotesk), ui-sans-serif, system-ui",
    "--display-tracking": `${design.typography.headingLetterSpacing}em`,
    "--display-weight": String(design.typography.headingWeight),
    "--hero-scale": String(design.typography.heroScale),
    "--section-spacing": `${design.layout.sectionSpacing}px`,
    "--container-width": `${design.layout.containerWidth}px`,
    "--border-width": `${design.layout.borderWidth}px`,
    "--corner-cut": `${design.layout.angularCorners ? design.layout.cornerCut : 0}px`,
    "--button-tracking": `${design.buttons.letterSpacing}em`,
    "--button-transform": design.buttons.uppercase ? "uppercase" : "none",
  } as React.CSSProperties;

  return (
    <div style={themeVars} className="relative min-h-screen bg-ink">
      <div className="relative">
        <PatternLayer config={design.background} className="fixed inset-0 h-screen w-full" />
        <div className="relative z-10">
          {animation.scrollProgressBar ? <ScrollProgress /> : null}
          <SiteHeader
            logoText={settings.logoText}
            items={navItems}
            ctaLabel="Let's talk"
            ctaHref="#contact"
          />
          <PageView />
          <main>{children}</main>
          <SiteFooter settings={settings} navItems={navItems} />
        </div>
      </div>
    </div>
  );
}

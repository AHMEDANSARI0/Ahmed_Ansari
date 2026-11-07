"use client";

import { useMemo, useState } from "react";
import { CircleSlash, CornerDownRight } from "lucide-react";
import {
  ColorControl,
  csrfFormData,
  SliderControl,
  StudioSaveBar,
  StudioSectionHeader,
  ToggleControl,
} from "@/components/admin/studio";
import { TriangleGrid } from "@/components/background/triangle-grid";
import { resetSettingAction, updateDesignAction } from "@/lib/actions/studio";
import type { DesignConfig } from "@/lib/config/design";
import type { PatternType } from "@/lib/config/background";

const headingFonts = [
  { value: "oxanium", label: "Oxanium" },
  { value: "space-grotesk", label: "Space Grotesk" },
] as const;

const patternTypes: { value: PatternType; label: string }[] = [
  { value: "triangular", label: "Triangular" },
  { value: "isometric", label: "Isometric" },
  { value: "diagonal-grid", label: "Diagonal grid" },
  { value: "none", label: "Off" },
];

const buttonStyles = [
  { value: "angular", label: "Angular clip" },
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
] as const;

export function DesignStudio({ initial }: { initial: DesignConfig }) {
  const [form, setForm] = useState<DesignConfig>(initial);
  const [baseline, setBaseline] = useState<DesignConfig>(initial);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);

  const patch = <K extends keyof DesignConfig>(key: K, value: Partial<DesignConfig[K]>) =>
    setForm((current) => ({ ...current, [key]: { ...current[key], ...value } }));

  async function save() {
    const formData = csrfFormData();
    formData.set("payload", JSON.stringify(form));
    const result = await updateDesignAction(formData);
    if (result.ok) setBaseline(form);
    return result.ok;
  }

  async function reset() {
    const formData = csrfFormData();
    formData.set("key", "design");
    const result = await resetSettingAction(formData);
    if (result.ok) {
      const defaults = (await import("@/lib/config/design")).defaultDesignConfig;
      setForm(defaults);
      setBaseline(defaults);
    }
    return result.ok;
  }

  const previewVars = {
    "--color-ink": form.colors.background,
    "--color-ink-soft": form.colors.surface,
    "--color-card": form.colors.card,
    "--color-accent": form.colors.accent,
    "--color-accent-soft": form.colors.accentSoft,
    "--color-fg": form.colors.text,
    "--color-fg-muted": form.colors.textMuted,
    "--color-line": form.colors.border,
  } as React.CSSProperties;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <section className="border border-line bg-card/40">
          <div className="px-4 pt-4">
            <StudioSectionHeader
              title="Colour system"
              description="Every value is written into CSS variables at request time — no rebuild needed."
            />
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            {(
              [
                ["background", "Background"],
                ["surface", "Surface"],
                ["card", "Card"],
                ["accent", "Accent"],
                ["accentSoft", "Accent secondary"],
                ["text", "Text"],
                ["textMuted", "Text muted"],
                ["border", "Border"],
              ] as const
            ).map(([key, label]) => (
              <ColorControl
                key={key}
                label={label}
                value={form.colors[key]}
                onChange={(value) => patch("colors", { [key]: value })}
              />
            ))}
          </div>
        </section>

        <section className="border border-line bg-card/40">
          <div className="px-4 pt-4">
            <StudioSectionHeader title="Geometric pattern" description="Canvas layer behind every section." />
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            <ToggleControl
              label="Pattern layer"
              value={form.background.enabled}
              onChange={(value) => patch("background", { enabled: value })}
            />
            <ToggleControl
              label="Cursor highlight"
              hint="Nearest triangles light up around the pointer."
              value={form.background.cursorInteraction}
              onChange={(value) => patch("background", { cursorInteraction: value })}
            />
            <ToggleControl
              label="Slow drift"
              value={form.background.drift}
              onChange={(value) => patch("background", { drift: value })}
            />
            <ToggleControl
              label="Show on mobile"
              value={form.background.showOnMobile}
              onChange={(value) => patch("background", { showOnMobile: value })}
            />
            <div className="sm:col-span-2">
              <span className="mono-label text-fg-dim">Pattern type</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {patternTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => patch("background", { type: type.value })}
                    className={`h-8 px-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                      form.background.type === type.value
                        ? "bg-accent text-ink"
                        : "border border-line text-fg-muted hover:border-accent/60 hover:text-accent"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <SliderControl
              label="Triangle size"
              value={form.background.triangleSize}
              min={40}
              max={320}
              step={2}
              suffix="px"
              onChange={(value) => patch("background", { triangleSize: value })}
            />
            <SliderControl
              label="Line opacity"
              value={form.background.lineOpacity}
              min={0}
              max={0.6}
              step={0.01}
              onChange={(value) => patch("background", { lineOpacity: value })}
            />
            <SliderControl
              label="Line thickness"
              value={form.background.lineThickness}
              min={0.4}
              max={3}
              step={0.1}
              suffix="px"
              onChange={(value) => patch("background", { lineThickness: value })}
            />
            <SliderControl
              label="Cursor radius"
              value={form.background.cursorRadius}
              min={60}
              max={460}
              step={10}
              suffix="px"
              onChange={(value) => patch("background", { cursorRadius: value })}
            />
            <SliderControl
              label="Highlight intensity"
              value={form.background.highlightIntensity}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => patch("background", { highlightIntensity: value })}
            />
            <SliderControl
              label="Drift speed"
              value={form.background.driftSpeed}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => patch("background", { driftSpeed: value })}
            />
            <ColorControl
              label="Line colour"
              value={form.background.lineColor}
              onChange={(value) => patch("background", { lineColor: value })}
            />
            <ColorControl
              label="Highlight colour"
              value={form.background.accentColor}
              onChange={(value) => patch("background", { accentColor: value })}
            />
          </div>
        </section>

        <section className="border border-line bg-card/40">
          <div className="px-4 pt-4">
            <StudioSectionHeader title="Typography & layout" />
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            <div className="border border-line px-3 py-2 sm:col-span-2">
              <span className="mono-label text-fg-dim">Display font</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {headingFonts.map((font) => (
                  <button
                    key={font.value}
                    type="button"
                    onClick={() => patch("typography", { headingFont: font.value })}
                    className={`h-8 px-3 font-mono text-[10px] uppercase tracking-[0.14em] ${
                      form.typography.headingFont === font.value
                        ? "bg-accent text-ink"
                        : "border border-line text-fg-muted hover:border-accent/60 hover:text-accent"
                    }`}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>
            <SliderControl
              label="Heading weight"
              value={form.typography.headingWeight}
              min={400}
              max={900}
              step={100}
              onChange={(value) => patch("typography", { headingWeight: value })}
            />
            <SliderControl
              label="Heading tracking"
              value={form.typography.headingLetterSpacing}
              min={-0.05}
              max={0.1}
              step={0.005}
              onChange={(value) => patch("typography", { headingLetterSpacing: value })}
            />
            <SliderControl
              label="Hero scale"
              value={form.typography.heroScale}
              min={0.7}
              max={1.6}
              step={0.05}
              suffix="×"
              onChange={(value) => patch("typography", { heroScale: value })}
            />
            <SliderControl
              label="Section spacing"
              value={form.layout.sectionSpacing}
              min={64}
              max={220}
              step={4}
              suffix="px"
              onChange={(value) => patch("layout", { sectionSpacing: value })}
            />
            <SliderControl
              label="Container width"
              value={form.layout.containerWidth}
              min={1080}
              max={1680}
              step={20}
              suffix="px"
              onChange={(value) => patch("layout", { containerWidth: value })}
            />
            <SliderControl
              label="Corner cut"
              value={form.layout.cornerCut}
              min={0}
              max={40}
              step={1}
              suffix="px"
              onChange={(value) => patch("layout", { cornerCut: value })}
            />
            <ToggleControl
              label="Angular corners"
              value={form.layout.angularCorners}
              onChange={(value) => patch("layout", { angularCorners: value })}
            />
            <div className="border border-line px-3 py-2 sm:col-span-2">
              <span className="mono-label text-fg-dim">Button style</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {buttonStyles.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => patch("buttons", { style: style.value })}
                    className={`h-8 px-3 font-mono text-[10px] uppercase tracking-[0.14em] ${
                      form.buttons.style === style.value
                        ? "bg-accent text-ink"
                        : "border border-line text-fg-muted hover:border-accent/60 hover:text-accent"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
            <ToggleControl
              label="Uppercase buttons"
              value={form.buttons.uppercase}
              onChange={(value) => patch("buttons", { uppercase: value })}
            />
            <SliderControl
              label="Button tracking"
              value={form.buttons.letterSpacing}
              min={0}
              max={0.3}
              step={0.01}
              onChange={(value) => patch("buttons", { letterSpacing: value })}
            />
          </div>
        </section>
      </div>

      <aside className="xl:sticky xl:top-4 xl:self-start">
        <div className="border border-line bg-card/40">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="mono-label text-accent">Live preview</span>
            <CornerDownRight className="h-3.5 w-3.5 text-fg-dim" />
          </div>

          <div style={previewVars} className="relative overflow-hidden bg-ink p-4">
            <TriangleGrid config={form.background} />
            <div className="relative">
              <span
                className="inline-block px-2 py-1 font-mono text-[9px] uppercase"
                style={{
                  background: form.colors.card,
                  color: form.colors.textMuted,
                  border: `${form.layout.borderWidth}px solid ${form.colors.border}`,
                }}
              >
                AI Automation Engineer
              </span>
              <p
                className="mt-3 leading-none"
                style={{
                  color: form.colors.text,
                  fontFamily:
                    form.typography.headingFont === "oxanium" ? "var(--font-oxanium)" : "var(--font-space-grotesk)",
                  fontWeight: form.typography.headingWeight,
                  letterSpacing: `${form.typography.headingLetterSpacing}em`,
                  fontSize: `${form.typography.heroScale * 26}px`,
                  textTransform: "uppercase",
                }}
              >
                Building <span style={{ color: form.colors.accent }}>intelligence</span>.
              </p>
              <p className="mt-2 text-[11px] leading-relaxed" style={{ color: form.colors.textMuted }}>
                Sample paragraph rendered with the current muted text colour and body stack.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="inline-flex h-8 items-center px-3 font-mono text-[9px] uppercase tracking-[0.14em]"
                  style={{
                    background: form.buttons.style === "outline" ? "transparent" : form.colors.accent,
                    color: form.buttons.style === "outline" ? form.colors.accent : form.colors.background,
                    border: `1px solid ${form.colors.accent}`,
                    letterSpacing: `${form.buttons.letterSpacing}em`,
                    textTransform: form.buttons.uppercase ? "uppercase" : "none",
                    clipPath:
                      form.buttons.style === "angular" && form.layout.angularCorners
                        ? `polygon(0 0, calc(100% - ${form.layout.cornerCut}px) 0, 100% ${form.layout.cornerCut}px, 100% 100%, 0 100%)`
                        : undefined,
                  }}
                >
                  Explore my work
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-line bg-line">
            <div className="bg-card px-3 py-2">
              <span className="mono-label text-fg-dim">Spacing</span>
              <p className="mt-1 font-mono text-[11px] text-fg">{form.layout.sectionSpacing}px</p>
            </div>
            <div className="bg-card px-3 py-2">
              <span className="mono-label text-fg-dim">Container</span>
              <p className="mt-1 font-mono text-[11px] text-fg">{form.layout.containerWidth}px</p>
            </div>
          </div>
        </div>

        <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-fg-dim">
          <CircleSlash className="mt-0.5 h-3 w-3 shrink-0" />
          Preview uses the same grid component and variables as the public page. Saving revalidates the
          design cache tag immediately.
        </p>
      </aside>

      <div className="xl:col-span-2">
        <StudioSaveBar onSave={save} onReset={reset} dirty={dirty} />
      </div>
    </div>
  );
}

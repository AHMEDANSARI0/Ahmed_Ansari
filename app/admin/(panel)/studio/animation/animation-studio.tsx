"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import {
  csrfFormData,
  SliderControl,
  StudioSaveBar,
  StudioSectionHeader,
  ToggleControl,
} from "@/components/admin/studio";
import { resetSettingAction, updateAnimationAction } from "@/lib/actions/studio";
import type { AnimationConfig, AnimationType } from "@/lib/config/animation";
import { SECTION_KEYS, type SectionKey } from "@/lib/config/sections";

const easingOptions: { value: AnimationConfig["easing"]; label: string }[] = [
  { value: "power2.out", label: "Power 2" },
  { value: "power3.out", label: "Power 3" },
  { value: "power4.out", label: "Power 4" },
  { value: "expo.out", label: "Expo" },
  { value: "back.out", label: "Back" },
  { value: "circ.out", label: "Circ" },
];

const typeOptions: { value: AnimationType; label: string }[] = [
  { value: "fade-up", label: "Fade up" },
  { value: "mask-reveal", label: "Mask" },
  { value: "word-reveal", label: "Words" },
  { value: "char-reveal", label: "Chars" },
  { value: "stagger-grid", label: "Stagger" },
  { value: "clip-path", label: "Clip" },
  { value: "none", label: "None" },
];

const sectionLabels: Record<SectionKey, string> = {
  hero: "Hero",
  about: "About",
  expertise: "Expertise",
  projects: "Projects",
  services: "Services",
  stack: "Stack",
  process: "Process",
  contact: "Contact",
};

export function AnimationStudio({ initial }: { initial: AnimationConfig }) {
  const [form, setForm] = useState<AnimationConfig>(initial);
  const [baseline, setBaseline] = useState<AnimationConfig>(initial);
  const [replayKey, setReplayKey] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);

  const patch = <K extends keyof AnimationConfig>(key: K, value: AnimationConfig[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (!form.enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;

    async function run() {
      const { gsap } = await import("gsap");
      if (cancelled || !stageRef.current) return;

      const items = Array.from(stageRef.current.querySelectorAll<HTMLElement>("[data-demo]"));
      const reduced = new Set<string>();

      for (const item of items) {
        const type = item.dataset.demo as AnimationType;
        if (reduced.has(type)) continue;
        reduced.add(type);

        const group = items.filter((entry) => entry.dataset.demo === type);
        const common = {
          duration: form.duration,
          ease: form.easing,
          delay: form.delay,
          stagger: 0.08 * form.intensity,
        };

        if (type === "fade-up") {
          gsap.fromTo(group, { y: 28 * form.intensity, opacity: 0 }, { y: 0, opacity: 1, ...common });
        } else if (type === "mask-reveal") {
          gsap.fromTo(
            group,
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", ...common, opacity: 1 },
          );
        } else if (type === "word-reveal") {
          gsap.fromTo(
            group.flatMap((entry) => Array.from(entry.querySelectorAll("span"))),
            { yPercent: 110, opacity: 0 },
            { yPercent: 0, opacity: 1, ...common },
          );
        } else if (type === "char-reveal") {
          gsap.fromTo(
            group.flatMap((entry) => Array.from(entry.querySelectorAll("span"))),
            { opacity: 0, x: -6 },
            { opacity: 1, x: 0, ...common, stagger: 0.02 },
          );
        } else if (type === "stagger-grid") {
          gsap.fromTo(group, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, ...common });
        } else if (type === "clip-path") {
          gsap.fromTo(
            group,
            { clipPath: "inset(0 0 100% 0)" },
            { clipPath: "inset(0 0 0% 0)", ...common, opacity: 1 },
          );
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [form, replayKey]);

  async function save() {
    const formData = csrfFormData();
    formData.set("payload", JSON.stringify(form));
    const result = await updateAnimationAction(formData);
    if (result.ok) setBaseline(form);
    return result.ok;
  }

  async function reset() {
    const formData = csrfFormData();
    formData.set("key", "animation");
    const result = await resetSettingAction(formData);
    if (result.ok) {
      const defaults = (await import("@/lib/config/animation")).defaultAnimationConfig;
      setForm(defaults);
      setBaseline(defaults);
    }
    return result.ok;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-6">
        <section className="border border-line bg-card/40">
          <div className="px-4 pt-4">
            <StudioSectionHeader
              title="Motion engine"
              description="One config drives hero timeline, scroll reveals, parallax and magnetic controls."
            />
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            <ToggleControl
              label="Animations enabled"
              hint="Off renders every section statically."
              value={form.enabled}
              onChange={(value) => patch("enabled", value)}
            />
            <ToggleControl
              label="Mobile animations"
              value={form.mobileEnabled}
              onChange={(value) => patch("mobileEnabled", value)}
            />
            <ToggleControl
              label="Scroll progress rail"
              value={form.scrollProgressBar}
              onChange={(value) => patch("scrollProgressBar", value)}
            />
            <ToggleControl
              label="Magnetic buttons"
              value={form.magneticButtons}
              onChange={(value) => patch("magneticButtons", value)}
            />
            <ToggleControl
              label="Hover lift"
              value={form.hoverLift}
              onChange={(value) => patch("hoverLift", value)}
            />
            <ToggleControl
              label="Cursor glow"
              value={form.cursorGlow}
              onChange={(value) => patch("cursorGlow", value)}
            />
            <SliderControl
              label="Duration"
              value={form.duration}
              min={0.2}
              max={2.4}
              step={0.05}
              suffix="s"
              onChange={(value) => patch("duration", value)}
            />
            <SliderControl
              label="Delay"
              value={form.delay}
              min={0}
              max={0.8}
              step={0.05}
              suffix="s"
              onChange={(value) => patch("delay", value)}
            />
            <SliderControl
              label="Intensity"
              value={form.intensity}
              min={0.2}
              max={1}
              step={0.05}
              onChange={(value) => patch("intensity", value)}
            />
            <SliderControl
              label="Parallax"
              value={form.parallaxIntensity}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => patch("parallaxIntensity", value)}
            />
            <div className="border border-line px-3 py-2">
              <span className="mono-label text-fg-dim">Easing</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {easingOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => patch("easing", option.value)}
                    className={`h-7 px-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] ${
                      form.easing === option.value
                        ? "bg-accent text-ink"
                        : "border border-line text-fg-muted hover:border-accent/60 hover:text-accent"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="border border-line px-3 py-2">
              <span className="mono-label text-fg-dim">Reduced motion fallback</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(["static", "fade"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patch("reducedMotionFallback", value)}
                    className={`h-7 px-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] ${
                      form.reducedMotionFallback === value
                        ? "bg-accent text-ink"
                        : "border border-line text-fg-muted hover:border-accent/60 hover:text-accent"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border border-line bg-card/40">
          <div className="px-4 pt-4">
            <StudioSectionHeader
              title="Per-section reveal"
              description="Applied by each section on the public page."
            />
          </div>
          <div className="divide-y divide-line">
            {SECTION_KEYS.map((key) => (
              <div key={key} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">
                  {sectionLabels[key]}
                </span>
                <div className="flex flex-wrap gap-1">
                  {typeOptions.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        patch("sections", { ...form.sections, [key]: type.value } as AnimationConfig["sections"])
                      }
                      className={`h-7 px-2 font-mono text-[9px] uppercase tracking-[0.1em] ${
                        (form.sections[key] ?? "none") === type.value
                          ? "bg-accent text-ink"
                          : "border border-line text-fg-dim hover:border-accent/50 hover:text-accent"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="xl:sticky xl:top-4 xl:self-start">
        <div className="border border-line bg-card/40">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="mono-label text-accent">Preview</span>
            <button
              type="button"
              onClick={() => setReplayKey((value) => value + 1)}
              className="inline-flex h-7 items-center gap-1.5 border border-line px-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-muted hover:border-accent/60 hover:text-accent"
            >
              <Play className="h-2.5 w-2.5" /> Replay
            </button>
          </div>

          <div ref={stageRef} key={replayKey} className="space-y-2 p-4">
            <div data-demo="fade-up" className="border border-line bg-ink px-3 py-2">
              <span className="mono-label text-fg-dim">fade-up</span>
            </div>
            <div data-demo="mask-reveal" className="border border-line bg-ink px-3 py-2">
              <span className="mono-label text-fg-dim">mask-reveal</span>
            </div>
            <div data-demo="word-reveal" className="border border-line bg-ink px-3 py-2">
              <span className="mono-label text-fg-dim">word</span>{" "}
              <span className="mono-label text-fg-dim">reveal</span>
            </div>
            <div data-demo="char-reveal" className="flex gap-0.5 border border-line bg-ink px-3 py-2">
              {"chars".split("").map((char, index) => (
                <span key={index} className="font-display text-sm text-fg-muted">
                  {char}
                </span>
              ))}
            </div>
            <div data-demo="stagger-grid" className="grid grid-cols-3 gap-1">
              {[0, 1, 2].map((index) => (
                <div key={index} className="h-8 border border-line bg-ink" />
              ))}
            </div>
            <div data-demo="clip-path" className="border border-accent/40 bg-accent/10 px-3 py-2">
              <span className="mono-label text-accent">clip-path</span>
            </div>
          </div>

          <p className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-fg-dim">
            This preview runs the real GSAP timeline with the exact duration, easing and intensity that
            will be used on the site. Reduced-motion visitors always get the static fallback.
          </p>
        </div>
      </aside>

      <div className="xl:col-span-2">
        <StudioSaveBar onSave={save} onReset={reset} dirty={dirty} />
      </div>
    </div>
  );
}

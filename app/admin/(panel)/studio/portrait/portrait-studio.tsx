"use client";

import { useMemo, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import {
  ColorControl,
  csrfFormData,
  SliderControl,
  StudioSaveBar,
  StudioSectionHeader,
  ToggleControl,
} from "@/components/admin/studio";
import { ParticlePortrait } from "@/components/portrait/particle-portrait";
import { resetSettingAction, updatePortraitAction } from "@/lib/actions/studio";
import type { PortraitConfig, ParticlePreset } from "@/lib/config/portrait";

type Device = "desktop" | "mobile";

const triggers = [
  { value: "load", label: "On load" },
  { value: "scroll", label: "On scroll" },
  { value: "hover", label: "On hover" },
] as const;

export function PortraitStudio({
  initial,
  portraitUrl,
  availableImages,
}: {
  initial: PortraitConfig;
  portraitUrl: string;
  availableImages: string[];
}) {
  const [form, setForm] = useState<PortraitConfig>(initial);
  const [baseline, setBaseline] = useState<PortraitConfig>(initial);
  const [device, setDevice] = useState<Device>("desktop");
  const [previewKey, setPreviewKey] = useState(0);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);
  const preset = form[device];

  const patchPreset = (patch: Partial<ParticlePreset>) =>
    setForm((current) => ({ ...current, [device]: { ...current[device], ...patch } }));

  async function save() {
    const formData = csrfFormData();
    formData.set("payload", JSON.stringify(form));
    const result = await updatePortraitAction(formData);
    if (result.ok) setBaseline(form);
    return result.ok;
  }

  async function reset() {
    const formData = csrfFormData();
    formData.set("key", "portrait");
    const result = await resetSettingAction(formData);
    if (result.ok) {
      const defaults = (await import("@/lib/config/portrait")).defaultPortraitConfig;
      setForm(defaults);
      setBaseline(defaults);
    }
    return result.ok;
  }

  const source = form.imageUrl ?? portraitUrl;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-6">
        <section className="border border-line bg-card/40">
          <div className="px-4 pt-4">
            <StudioSectionHeader title="Portrait source" description="The asset the particle layer samples." />
          </div>
          <div className="space-y-2 p-4">
            <ToggleControl
              label="Show portrait block"
              value={form.visible}
              onChange={(value) => setForm((current) => ({ ...current, visible: value }))}
            />
            <ToggleControl
              label="Particle reconstruction"
              hint="Off renders the plain photograph."
              value={form.mode === "particles"}
              onChange={(value) =>
                setForm((current) => ({ ...current, mode: value ? "particles" : "static" }))
              }
            />
            <div className="border border-line px-3 py-2">
              <span className="mono-label text-fg-dim">Image</span>
              <select
                value={form.imageUrl ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, imageUrl: event.target.value || null }))
                }
                className="mt-2 h-9 w-full border border-line bg-ink px-2 text-[12px] text-fg"
                aria-label="Portrait image"
              >
                <option value="">Default uploads/placeholder</option>
                {availableImages.map((image) => (
                  <option key={image} value={image}>
                    {image}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[10.5px] text-fg-dim">
                Media uploads arrive in phase 4; until then the placeholder asset ships with the build.
              </p>
            </div>
            <div className="border border-line px-3 py-2">
              <span className="mono-label text-fg-dim">Reconstruct when</span>
              <div className="mt-2 flex gap-1.5">
                {triggers.map((trigger) => (
                  <button
                    key={trigger.value}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, trigger: trigger.value }))}
                    className={`h-7 px-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] ${
                      form.trigger === trigger.value
                        ? "bg-accent text-ink"
                        : "border border-line text-fg-muted hover:border-accent/60 hover:text-accent"
                    }`}
                  >
                    {trigger.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border border-line bg-card/40">
          <div className="px-4 pt-4">
            <StudioSectionHeader
              title={device === "desktop" ? "Desktop preset" : "Mobile preset"}
              description="Saved independently, applied by viewport."
              right={
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setDevice("desktop")}
                    className={`inline-flex h-7 items-center gap-1.5 px-2 font-mono text-[9.5px] uppercase tracking-[0.14em] ${
                      device === "desktop" ? "bg-accent text-ink" : "border border-line text-fg-muted"
                    }`}
                  >
                    <Monitor className="h-3 w-3" /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevice("mobile")}
                    className={`inline-flex h-7 items-center gap-1.5 px-2 font-mono text-[9.5px] uppercase tracking-[0.14em] ${
                      device === "mobile" ? "bg-accent text-ink" : "border border-line text-fg-muted"
                    }`}
                  >
                    <Smartphone className="h-3 w-3" /> Mobile
                  </button>
                </div>
              }
            />
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            <SliderControl
              label="Density"
              value={preset.density}
              min={8}
              max={48}
              step={1}
              onChange={(value) => patchPreset({ density: value })}
            />
            <SliderControl
              label="Particle size"
              value={preset.particleSize}
              min={0.6}
              max={3.4}
              step={0.1}
              suffix="px"
              onChange={(value) => patchPreset({ particleSize: value })}
            />
            <SliderControl
              label="Assembly time"
              value={preset.assemblyDuration}
              min={400}
              max={2400}
              step={50}
              suffix="ms"
              onChange={(value) => patchPreset({ assemblyDuration: value })}
            />
            <SliderControl
              label="Scatter radius"
              value={preset.scatterRadius}
              min={40}
              max={600}
              step={10}
              suffix="px"
              onChange={(value) => patchPreset({ scatterRadius: value })}
            />
            <SliderControl
              label="Brightness gate"
              value={preset.brightnessThreshold}
              min={0}
              max={0.6}
              step={0.01}
              onChange={(value) => patchPreset({ brightnessThreshold: value })}
            />
            <SliderControl
              label="Glow"
              value={preset.glow}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => patchPreset({ glow: value })}
            />
            <SliderControl
              label="Idle movement"
              value={preset.idleMovement}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => patchPreset({ idleMovement: value })}
            />
            <SliderControl
              label="Accent mix"
              value={preset.accentMix}
              min={0}
              max={1}
              step={0.02}
              onChange={(value) => patchPreset({ accentMix: value })}
            />
            <SliderControl
              label="Cursor radius"
              value={preset.interactionRadius}
              min={40}
              max={280}
              step={10}
              suffix="px"
              onChange={(value) => patchPreset({ interactionRadius: value })}
            />
            <SliderControl
              label="Cursor push"
              value={preset.interactionStrength}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => patchPreset({ interactionStrength: value })}
            />
            <ColorControl
              label="Particle colour"
              value={preset.color}
              onChange={(value) => patchPreset({ color: value })}
            />
            <ColorControl
              label="Accent colour"
              value={preset.accentColor}
              onChange={(value) => patchPreset({ accentColor: value })}
            />
          </div>
        </section>
      </div>

      <aside className="xl:sticky xl:top-4 xl:self-start">
        <div className="border border-line bg-card/40">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="mono-label text-accent">Preview / {device}</span>
            <button
              type="button"
              onClick={() => setPreviewKey((value) => value + 1)}
              className="h-7 border border-line px-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-muted hover:border-accent/60 hover:text-accent"
            >
              Replay
            </button>
          </div>
          <div className="p-4">
            <div
              className={`relative mx-auto overflow-hidden border border-line bg-ink-soft ${
                device === "desktop" ? "aspect-[4/5] w-[240px]" : "aspect-[4/5] w-[190px]"
              }`}
            >
              {form.mode === "particles" ? (
                <ParticlePortrait
                  key={`${previewKey}-${device}`}
                  src={source}
                  preset={preset}
                  trigger="load"
                  className="absolute inset-0"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={source} alt="Portrait preview" className="h-full w-full object-cover" />
              )}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-px bg-line">
              <div className="bg-card px-2 py-1.5">
                <dt className="mono-label text-fg-dim">Budget</dt>
                <dd className="font-mono text-[11px] text-fg">
                  ≈{Math.round(520 + (preset.density - 8) * 60)}
                </dd>
              </div>
              <div className="bg-card px-2 py-1.5">
                <dt className="mono-label text-fg-dim">Assembly</dt>
                <dd className="font-mono text-[11px] text-fg">{(preset.assemblyDuration / 1000).toFixed(2)}s</dd>
              </div>
            </dl>
          </div>
          <p className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-fg-dim">
            Particles are chosen by luminance weight, so the lit face survives while the dark jacket stays
            sparse. Colours come from the photograph; the accent colour replaces a share of them.
          </p>
        </div>
      </aside>

      <div className="xl:col-span-2">
        <StudioSaveBar onSave={save} onReset={reset} dirty={dirty} />
      </div>
    </div>
  );
}

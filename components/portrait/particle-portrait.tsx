"use client";

import { useEffect, useRef, useState } from "react";
import type { ParticlePreset } from "@/lib/config/portrait";
import { easeOutCubic, sampleImage, type Sampling } from "@/lib/particles/sampling";

type Props = {
  src: string;
  preset: ParticlePreset;
  mobilePreset?: ParticlePreset;
  trigger: "load" | "scroll" | "hover";
  className?: string;
  label?: string;
};

type Runtime = {
  sampling: Sampling;
  scale: number;
  originX: number;
  originY: number;
  startedAt: number | null;
  pointerX: number;
  pointerY: number;
  pointerActive: boolean;
  ready: boolean;
};

function glowSprite(color: string) {
  const sprite = document.createElement("canvas");
  const size = 64;
  sprite.width = size;
  sprite.height = size;
  const context = sprite.getContext("2d");
  if (!context) return sprite;

  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.45, color + "66");
  gradient.addColorStop(1, color + "00");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return sprite;
}

export function ParticlePortrait({ src, preset, mobilePreset, trigger, className, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const runtime = useRef<Runtime | null>(null);
  const frame = useRef<number | null>(null);
  const [assembled, setAssembled] = useState(false);
  const settled = useRef(false);

  useEffect(() => {
    if (!mobilePreset) return;
    const query = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [mobilePreset]);

  const activePreset = isMobile && mobilePreset ? mobilePreset : preset;
  const sprites = useRef<{ accent: HTMLCanvasElement; base: HTMLCanvasElement } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let width = 0;
    let height = 0;
    let dpr = 1;

    function pointer(event: PointerEvent) {
      const state = runtime.current;
      if (!state) return;
      const bounds = canvas!.getBoundingClientRect();
      state.pointerX = event.clientX - bounds.left;
      state.pointerY = event.clientY - bounds.top;
      state.pointerActive = true;
    }

    function leave() {
      const state = runtime.current;
      if (state) state.pointerActive = false;
    }

    function resize() {
      const bounds = canvas!.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;
      width = bounds.width;
      height = bounds.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const state = runtime.current;
      if (state) {
        // Cover-fit the sampled portrait into the current box.
        state.scale = Math.max(width / state.sampling.width, height / state.sampling.height);
        state.originX = (width - state.sampling.width * state.scale) / 2;
        state.originY = (height - state.sampling.height * state.scale) / 2;
      }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    sprites.current = {
      accent: glowSprite(activePreset.accentColor),
      base: glowSprite(activePreset.color),
    };

    const image = new Image();
    image.decoding = "async";

    image.onload = () => {
      if (disposed) return;

      const sampling = sampleImage(image, image.naturalWidth, image.naturalHeight, activePreset.density, {
        brightnessThreshold: activePreset.brightnessThreshold,
        scatterRadius: activePreset.scatterRadius,
        accentMix: activePreset.accentMix,
        accentColor: activePreset.accentColor,
      });

      runtime.current = {
        sampling,
        scale: 1,
        originX: 0,
        originY: 0,
        startedAt: reduced || trigger === "load" ? performance.now() : null,
        pointerX: 0,
        pointerY: 0,
        pointerActive: false,
        ready: true,
      };

      resize();
      settled.current = reduced;
      setAssembled(reduced);
      start();
    };

    image.src = src;

    function start() {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(tick);
    }

    function stop() {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    }

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    function tick(now: number) {
      const state = runtime.current;
      if (!state || !state.ready) {
        frame.current = requestAnimationFrame(tick);
        return;
      }

      const { sampling } = state;
      context!.clearRect(0, 0, width, height);

      if (state.startedAt === null) {
        // Scroll or hover trigger: assemble once the canvas is close to the viewport.
        const bounds = canvas!.getBoundingClientRect();
        if (bounds.top < window.innerHeight * 0.9) state.startedAt = now;
      }

      const rawProgress =
        state.startedAt === null ? 0 : Math.min(1, (now - state.startedAt) / Math.max(400, activePreset.assemblyDuration));
      const progress = reduced ? 1 : easeOutCubic(rawProgress);

      if (!reduced && rawProgress >= 1 && !settled.current) {
        settled.current = true;
        setAssembled(true);
      }

      context!.globalCompositeOperation = "source-over";

      for (const particle of sampling.particles) {
        const local = Math.max(0, Math.min(1, (progress - particle.delay) / (1 - particle.delay || 1)));
        const eased = easeOutCubic(local);

        const homeX = state.originX + particle.homeX * state.scale;
        const homeY = state.originY + particle.homeY * state.scale;

        const idle = activePreset.idleMovement * 2.2;
        const driftX = Math.sin(now / 2600 + particle.jitter) * idle;
        const driftY = Math.cos(now / 3100 + particle.jitter) * idle;

        let targetX = homeX + driftX;
        let targetY = homeY + driftY;

        if (state.pointerActive && activePreset.interactionStrength > 0) {
          const dx = homeX - state.pointerX;
          const dy = homeY - state.pointerY;
          const distance = Math.hypot(dx, dy);
          if (distance < activePreset.interactionRadius && distance > 0.01) {
            const push = (1 - distance / activePreset.interactionRadius) * activePreset.interactionRadius * 0.35;
            targetX += (dx / distance) * push * activePreset.interactionStrength;
            targetY += (dy / distance) * push * activePreset.interactionStrength;
          }
        }

        const x = homeX + particle.offsetX * (1 - eased) + (targetX - homeX) * eased;
        const y = homeY + particle.offsetY * (1 - eased) + (targetY - homeY) * eased;

        const size = activePreset.particleSize * (0.55 + particle.weight * 0.9) * (0.7 + (1 - eased) * 0.8);

        if (activePreset.glow > 0 && particle.accent && sprites.current) {
          const glowSize = activePreset.particleSize * 9 * Math.max(0.2, eased);
          context!.globalAlpha = activePreset.glow * 0.3 * eased;
          context!.drawImage(
            sprites.current.accent,
            x + size / 2 - glowSize / 2,
            y + size / 2 - glowSize / 2,
            glowSize,
            glowSize,
          );
        }

        context!.globalAlpha = 0.25 + eased * 0.75;
        context!.fillStyle = particle.color;
        context!.fillRect(x, y, size, size);
      }

      context!.globalAlpha = 1;
      context!.globalCompositeOperation = "source-over";

      if (!reduced) frame.current = requestAnimationFrame(tick);
      else frame.current = null;
    }

    canvas.addEventListener("pointermove", pointer);
    canvas.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      stop();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", pointer);
      canvas.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", onVisibility);
      runtime.current = null;
    };
  }, [src, activePreset, trigger]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label ?? "Portrait reconstructed from particles"}
        className="h-full w-full"
      />
      {!assembled ? (
        <span className="pointer-events-none absolute inset-x-3 bottom-3 font-mono text-[9px] uppercase tracking-[0.2em] text-fg-dim">
          Reconstructing…
        </span>
      ) : null}
    </div>
  );
}

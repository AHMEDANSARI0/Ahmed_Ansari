"use client";

import { useEffect, useRef } from "react";
import type { PatternConfig } from "@/lib/config/background";

const CELL_RATIO = 0.866;

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function blend(from: { r: number; g: number; b: number }, to: { r: number; g: number; b: number }, t: number) {
  return `rgb(${Math.round(from.r + (to.r - from.r) * t)},${Math.round(
    from.g + (to.g - from.g) * t,
  )},${Math.round(from.b + (to.b - from.b) * t)})`;
}

type Edge = { x1: number; y1: number; x2: number; y2: number; mx: number; my: number };

function buildEdges(width: number, height: number, size: number, offsetX: number, offsetY: number) {
  const edgeHeight = size * CELL_RATIO;
  const cols = Math.ceil(width / (size / 2)) + 2;
  const rows = Math.ceil(height / edgeHeight) + 2;
  const edges: Edge[] = [];

  for (let row = -1; row < rows; row += 1) {
    const y = row * edgeHeight + offsetY;
    const shift = row % 2 === 0 ? 0 : size / 2;

    for (let col = -1; col < cols; col += 1) {
      const x = col * size + shift + offsetX;
      const apexX = x + size / 2;
      const apexY = y + edgeHeight;

      edges.push({ x1: x, y1: y, x2: apexX, y2: apexY, mx: x + size / 4, my: y + edgeHeight / 2 });
      edges.push({
        x1: apexX,
        y1: apexY,
        x2: x + size,
        y2: y,
        mx: x + (size * 3) / 4,
        my: y + edgeHeight / 2,
      });
    }

    for (let col = -1; col < cols; col += 1) {
      const x = col * size + shift + offsetX;
      edges.push({
        x1: x,
        y1: y,
        x2: x + size,
        y2: y,
        mx: x + size / 2,
        my: y + edgeHeight / 2,
      });
    }
  }

  return edges;
}

export function TriangleGrid({ config }: { config: PatternConfig }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const lineRgb = hexToRgb(config.lineColor);
    const accentRgb = hexToRgb(config.accentColor);
    const baseColor = `rgba(${lineRgb.r},${lineRgb.g},${lineRgb.b},${config.lineOpacity})`;
    const pointer = { x: -1000, y: -1000, active: false };
    const drift = { x: 0, y: 0 };

    let width = 0;
    let height = 0;
    let edges: Edge[] = [];
    let frame = 0;
    let visible = true;
    let lastTime = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      edges = buildEdges(width, height, config.triangleSize, 0, 0);
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.lineWidth = config.lineThickness;
      context.lineCap = "butt";

      const radius = config.cursorRadius;
      const highlight = config.cursorInteraction && pointer.active;

      if (!highlight) {
        context.strokeStyle = baseColor;
        context.beginPath();
        for (const edge of edges) {
          context.moveTo(edge.x1 + drift.x, edge.y1 + drift.y);
          context.lineTo(edge.x2 + drift.x, edge.y2 + drift.y);
        }
        context.stroke();
        return;
      }

      context.strokeStyle = baseColor;
      context.beginPath();
      for (const edge of edges) {
        context.moveTo(edge.x1 + drift.x, edge.y1 + drift.y);
        context.lineTo(edge.x2 + drift.x, edge.y2 + drift.y);
      }
      context.stroke();

      const radiusSq = radius * radius;
      for (const edge of edges) {
        const cx = edge.mx + drift.x;
        const cy = edge.my + drift.y;
        const dx = cx - pointer.x;
        const dy = cy - pointer.y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq > radiusSq) continue;

        const strength = 1 - Math.sqrt(distanceSq) / radius;
        context.strokeStyle = blend(lineRgb, accentRgb, Math.min(1, strength * (0.5 + config.highlightIntensity)));
        context.globalAlpha = Math.min(1, strength * 1.4);
        context.beginPath();
        context.moveTo(edge.x1 + drift.x, edge.y1 + drift.y);
        context.lineTo(edge.x2 + drift.x, edge.y2 + drift.y);
        context.stroke();
      }
      context.globalAlpha = 1;
    };

    const loop = (time: number) => {
      frame = requestAnimationFrame(loop);
      if (!visible) return;

      if (config.drift && time - lastTime > 16) {
        lastTime = time;
        const step = config.driftSpeed * 0.12;
        drift.x -= step;
        drift.y -= step * 0.4;
        if (Math.abs(drift.x) > config.triangleSize) drift.x = 0;
        if (Math.abs(drift.y) > config.triangleSize) drift.y = 0;
      }

      draw();
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY - canvas.getBoundingClientRect().top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -1000;
      pointer.y = -1000;
    };

    const onVisibility = () => {
      visible = !document.hidden;
    };

    resize();
    draw();
    frame = requestAnimationFrame(loop);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [config]);

  if (!config.enabled || config.type === "none") return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity: 1 }}
    />
  );
}

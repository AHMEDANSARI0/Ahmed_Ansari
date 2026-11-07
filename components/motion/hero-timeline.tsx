"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroTimeline({
  children,
  enabled = true,
  duration = 0.9,
}: {
  children: React.ReactNode;
  enabled?: boolean;
  duration?: number;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled || prefersReducedMotion()) return;

    const context = gsap.context(() => {
      const frame = root.querySelector("[data-hero-frame]");
      const lines = root.querySelectorAll("[data-hero-line]");
      const scan = root.querySelector("[data-hero-scan]");

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (frame) {
        timeline.fromTo(
          frame,
          { clipPath: "inset(0 0 100% 0)", opacity: 0.4 },
          { clipPath: "inset(0 0 0% 0)", opacity: 1, duration: duration * 0.9 },
          0,
        );
      }

      if (lines.length > 0) {
        timeline.fromTo(
          lines,
          { yPercent: 115, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: duration, stagger: 0.08 },
          0.12,
        );
      }

      if (scan) {
        timeline.fromTo(
          scan,
          { scaleX: 0, transformOrigin: "left center" },
          { scaleX: 1, duration: duration * 1.6, ease: "power2.inOut" },
          0.1,
        );
      }
    }, root);

    return () => context.revert();
  }, [enabled, duration]);

  return <div ref={rootRef}>{children}</div>;
}

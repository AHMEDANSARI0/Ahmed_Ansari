"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reduced = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(reduced);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || started.current) return;
        started.current = true;

        const start = performance.now();
        const duration = 900;

        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

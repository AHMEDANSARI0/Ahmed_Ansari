"use client";

import { useEffect, useRef } from "react";

export function Parallax({
  children,
  intensity = 0.2,
  className,
}: {
  children: React.ReactNode;
  intensity?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
      node.style.transform = `translate3d(0, ${(-centerOffset * intensity).toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [intensity]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}

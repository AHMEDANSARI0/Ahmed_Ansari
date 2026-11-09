"use client";

import { useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function MagneticLink({
  href,
  children,
  className,
  strength = 10,
  external,
  enabled = true,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  strength?: number;
  external?: boolean;
  enabled?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);

  const reset = () => {
    const node = ref.current;
    if (node) node.style.transform = "translate3d(0,0,0)";
  };

  const move = (event: React.PointerEvent<HTMLAnchorElement>) => {
    const node = ref.current;
    if (!node) return;
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const rect = node.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * strength;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * strength;
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const shared = {
    ref,
    onPointerMove: move,
    onPointerLeave: reset,
    className: cn("transition-transform duration-200 will-change-transform", className),
  };

  if (external) {
    return (
      <a {...shared} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link {...shared} href={href}>
      {children}
    </Link>
  );
}

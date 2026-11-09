"use client";

import { useEffect } from "react";

/**
 * Reveals elements that CSS scroll-driven animations cannot reach.
 *
 * Browsers with `animation-timeline: view()` animate on their own; everywhere else
 * an IntersectionObserver adds `.motion-in` once, which the stylesheet animates.
 * Nothing here touches content on a browser that already supports the CSS path.
 */
export function MotionObserver() {
  useEffect(() => {
    const supports =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("animation-timeline: view()");
    if (supports) return;

    // Only now may the stylesheet hide anything: without this class the tree stays
    // fully visible, which is what a no-JS visitor gets.
    document.documentElement.classList.add("motion-ready");

    const seen = new WeakSet<Element>();
    const reveal = (element: Element) => {
      if (seen.has(element)) return;
      seen.add(element);
      element.classList.add("motion-in");
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    const tracked = new Set<Element>();
    const track = () => {
      for (const element of document.querySelectorAll(".motion-observed:not(.motion-in)")) {
        if (tracked.has(element)) continue;
        tracked.add(element);
        observer.observe(element);
      }
    };

    track();

    // Sections animate in after hydration, so new nodes need a second pass.
    const mutations = new MutationObserver(track);
    mutations.observe(document.body, { childList: true, subtree: true });

    // Content already on screen at load must not wait for a scroll event.
    requestAnimationFrame(track);

    return () => {
      observer.disconnect();
      mutations.disconnect();
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);

  return null;
}

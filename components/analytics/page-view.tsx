"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { readBrowserId } from "@/lib/analytics/browser-id";

export function PageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const body = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
      viewport: window.innerWidth,
      // Read after mount so the server render never depends on storage.
      browserId: readBrowserId(),
    });

    const send = () => {
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => undefined);
    };

    // Deferred so the beacon never competes with hydration.
    const handle = window.setTimeout(send, 1200);
    return () => window.clearTimeout(handle);
  }, [pathname]);

  return null;
}

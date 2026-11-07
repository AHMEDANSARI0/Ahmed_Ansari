"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/admin/sidebar";
import { LogoutButton } from "@/components/admin/logout-button";
import type { Permission } from "@/lib/permissions";

export function AdminShell({
  children,
  admin,
  permissions,
}: {
  children: React.ReactNode;
  admin: { name: string; email: string; role: string };
  permissions: Permission[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink">
      <Sidebar open={open} onClose={() => setOpen(false)} permissions={permissions} />

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ink/85 px-4 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              className="text-fg-muted hover:text-fg lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-dim sm:flex">
              <span className="h-1.5 w-1.5 bg-emerald-400" />
              Session active
              <span className="text-line">/</span>
              <span className="text-fg-muted">{admin.role}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[12px] leading-tight text-fg">{admin.name}</p>
              <p className="font-mono text-[10px] leading-tight text-fg-dim">{admin.email}</p>
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

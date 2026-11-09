"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { adminNavigation, type NavGroup } from "@/components/admin/navigation";
import { cn } from "@/lib/utils";
import type { Permission } from "@/lib/permissions";

export function Sidebar({
  open,
  onClose,
  permissions,
}: {
  open: boolean;
  onClose: () => void;
  permissions: Permission[];
}) {
  const pathname = usePathname();
  const allowed = (group: NavGroup) =>
    group.items.some((item) => permissions.includes(item.permission));

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-line bg-[#0a0a0b] transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="h-2 w-2 bg-accent" />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg">
              Control
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="text-fg-dim hover:text-fg lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-none px-2 py-4">
          {adminNavigation.map((group) => {
            if (!allowed(group)) return null;
            return (
              <div key={group.label} className="mb-5">
                <p className="px-2 pb-2 font-mono text-[9px] uppercase tracking-[0.24em] text-fg-dim">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    if (!permissions.includes(item.permission)) return null;
                    const active =
                      pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "group flex items-center gap-2.5 border-l-2 px-2 py-2 text-[12.5px] transition-colors",
                            active
                              ? "border-accent bg-white/[0.04] text-fg"
                              : "border-transparent text-fg-muted hover:bg-white/[0.02] hover:text-fg",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              active ? "text-accent" : "text-fg-dim group-hover:text-fg-muted",
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-line px-4 py-3">
          <Link
            href="/"
            target="_blank"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim transition-colors hover:text-accent"
          >
            View public site ↗
          </Link>
        </div>
      </aside>
    </>
  );
}

"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Toast = { id: number; title: string; description?: string; tone: "success" | "error" | "info" };

type ToastContextValue = {
  push: (toast: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...toast, id }]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, description) => push({ title, description, tone: "success" }),
      error: (title, description) => push({ title, description, tone: "error" }),
      info: (title, description) => push({ title, description, tone: "info" }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto border bg-card/95 px-4 py-3 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9)] animate-enter",
              toast.tone === "success" && "border-emerald-500/40",
              toast.tone === "error" && "border-red-500/40",
              toast.tone === "info" && "border-line",
            )}
          >
            <p className="text-sm font-medium text-fg">{toast.title}</p>
            {toast.description ? (
              <p className="mt-1 text-[12px] text-fg-muted">{toast.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

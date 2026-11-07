"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { create } from "zustand";
import { cx } from "./primitives";

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, children, wide, labelledBy }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    const node = ref.current;
    const focusables = () => Array.from(node?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])') ?? []);
    (focusables()[0] ?? node)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      (lastFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div onMouseDown={onClose} className="fixed inset-0 z-50 grid place-items-center p-6 bg-ink/40">
      <div ref={ref} role="dialog" aria-modal="true" aria-label={labelledBy ? undefined : title} aria-labelledby={labelledBy} tabIndex={-1} onMouseDown={(e) => e.stopPropagation()} className={cx("bg-white rounded-card w-full max-h-[90vh] overflow-auto p-8 shadow-pop animate-rise outline-none", wide ? "max-w-3xl" : "max-w-xl")}>
        <button type="button" onClick={onClose} aria-label="Close dialog" className="float-right -mt-2 -mr-2 p-2 rounded-control text-body hover:bg-surface cursor-pointer">
          <X size={16} aria-hidden />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Toasts ---------------- */
type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };
const useToasts = create<{ items: ToastItem[]; push: (kind: ToastKind, message: string) => void; dismiss: (id: number) => void }>((set) => ({
  items: [],
  push: (kind, message) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { id, kind, message }].slice(-4) }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 4500);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (m: string) => useToasts.getState().push("success", m),
  error: (m: string) => useToasts.getState().push("error", m),
  info: (m: string) => useToasts.getState().push("info", m),
};

export function Toaster() {
  const items = useToasts((s) => s.items);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div aria-live="polite" role="status" className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100%-3rem)]">
      {items.map((t) => (
        <div key={t.id} className="flex items-start gap-3 bg-white border border-line rounded-card shadow-float px-4 py-3 text-sm text-ink animate-rise">
          {t.kind === "success" ? <CheckCircle2 size={16} className="text-ok mt-1 flex-none" aria-hidden /> : t.kind === "error" ? <AlertCircle size={16} className="text-bad mt-1 flex-none" aria-hidden /> : <Info size={16} className="text-brand mt-1 flex-none" aria-hidden />}
          <span className="flex-1">{t.message}</span>
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-body hover:text-ink cursor-pointer">
            <X size={16} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}

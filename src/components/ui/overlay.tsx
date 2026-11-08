"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { create } from "zustand";
import { backdrop, modalPanel, toastItem, t } from "@/lib/motion";
import { cx } from "@/lib/utils";

/** Shared focus trap, Escape to close, scroll lock and focus restore. */
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<Element | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    const node = ref.current;
    const focusables = () => Array.from(node?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])') ?? []);
    (focusables()[0] ?? node)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0],
          last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
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
  }, [open]);
  return ref;
}

const CLOSE_BTN = "p-2 min-w-10 min-h-10 grid place-items-center rounded-control text-body hover:bg-surface cursor-pointer";

/** Scales in from 96% over a fading backdrop. */
export function Modal({ open, onClose, title, children, wide, labelledBy }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; labelledBy?: string }) {
  const ref = useDialog(open, onClose);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="modal" variants={backdrop} initial="hidden" animate="show" exit="exit" onMouseDown={onClose} className="fixed inset-0 z-50 grid place-items-center p-6 bg-ink/40">
          <motion.div variants={modalPanel} ref={ref} role="dialog" aria-modal="true" aria-label={labelledBy ? undefined : title} aria-labelledby={labelledBy} tabIndex={-1} onMouseDown={(e) => e.stopPropagation()} className={cx("bg-white rounded-card w-full max-h-[90vh] overflow-auto p-8 shadow-pop outline-none", wide ? "max-w-3xl" : "max-w-xl")}>
            <div className="flex justify-end -mt-4 -mr-4 h-0">
              <button type="button" onClick={onClose} aria-label="Close dialog" className={CLOSE_BTN}>
                <X size={16} aria-hidden />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Right-hand drawer that slides in. */
export function Drawer({ open, onClose, title, children, width = 480 }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number }) {
  const ref = useDialog(open, onClose);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="drawer" variants={backdrop} initial="hidden" animate="show" exit="exit" onMouseDown={onClose} className="fixed inset-0 z-50 bg-ink/40 flex justify-end">
          <motion.aside
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ x: "100%" }}
            animate={{ x: 0, transition: t.page }}
            exit={{ x: "100%", transition: t.ui }}
            style={{ maxWidth: width }}
            className="bg-white w-full h-full overflow-auto p-8 shadow-pop outline-none"
          >
            <div className="flex justify-end -mt-4 -mr-4 h-0">
              <button type="button" onClick={onClose} aria-label="Close panel" className={CLOSE_BTN}>
                <X size={16} aria-hidden />
              </button>
            </div>
            {children}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
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
    setTimeout(() => set((s) => ({ items: s.items.filter((x) => x.id !== id) })), 4500);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (m: string) => useToasts.getState().push("success", m),
  error: (m: string) => useToasts.getState().push("error", m),
  info: (m: string) => useToasts.getState().push("info", m),
};

/** Toasts slide in from the right. */
export function Toaster() {
  const items = useToasts((s) => s.items);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div aria-live="polite" role="status" className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100%-3rem)]">
      <AnimatePresence initial={false}>
        {items.map((x) => (
          <motion.div key={x.id} layout variants={toastItem} initial="hidden" animate="show" exit="exit" className="flex items-start gap-3 bg-white border border-line rounded-card shadow-float px-4 py-3 text-sm text-ink">
            {x.kind === "success" ? <CheckCircle2 size={16} className="text-ok mt-1 flex-none" aria-hidden /> : x.kind === "error" ? <AlertCircle size={16} className="text-bad mt-1 flex-none" aria-hidden /> : <Info size={16} className="text-brand mt-1 flex-none" aria-hidden />}
            <span className="flex-1">{x.message}</span>
            <button type="button" onClick={() => dismiss(x.id)} aria-label="Dismiss notification" className="text-body hover:text-ink cursor-pointer min-w-6 min-h-6 grid place-items-center">
              <X size={16} aria-hidden />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

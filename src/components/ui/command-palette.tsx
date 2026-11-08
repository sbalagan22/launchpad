"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, FileText, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { search } from "@/services";
import type { PaletteResult } from "@/schemas/views";
import { backdrop, modalPanel } from "@/lib/motion";
import { cx } from "@/lib/utils";

type Row = { key: string; label: string; sub?: string; href: string; kind: "page" | "project" | "cert" };

function flatten(r: PaletteResult | null): Row[] {
  if (!r) return [];
  return [
    ...r.pages.map((p): Row => ({ key: `p:${p.href}`, label: p.label, href: p.href, kind: "page" })),
    ...r.projects.map((p): Row => ({ key: `j:${p.id}`, label: p.title, sub: p.business, href: p.href, kind: "project" })),
    ...r.certs.map((c): Row => ({ key: `c:${c.id}`, label: c.name, sub: c.issuer, href: c.href, kind: "cert" })),
  ];
}

/** Cmd+K or Ctrl+K opens it from anywhere. Arrow keys move, Enter opens, Escape closes. */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [result, setResult] = useState<PaletteResult | null>(null);
  const [error, setError] = useState(false);
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const rows = useMemo(() => flatten(result), [result]);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    let live = true;
    const h = setTimeout(() => {
      search.palette(q).then(
        (r) => live && (setResult(r), setError(false), setIdx(0)),
        () => live && setError(true),
      );
    }, q ? 120 : 0);
    return () => {
      live = false;
      clearTimeout(h);
    };
  }, [q, open]);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 30);
  }, [open]);

  const go = (r: Row | undefined) => {
    if (!r) return;
    close();
    router.push(r.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") (e.preventDefault(), setIdx((i) => Math.min(rows.length - 1, i + 1)));
    else if (e.key === "ArrowUp") (e.preventDefault(), setIdx((i) => Math.max(0, i - 1)));
    else if (e.key === "Enter") (e.preventDefault(), go(rows[idx]));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="palette" variants={backdrop} initial="hidden" animate="show" exit="exit" onMouseDown={close} className="fixed inset-0 z-[70] bg-ink/40 grid place-items-start justify-center pt-[12vh] px-4">
          <motion.div variants={modalPanel} role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKeyDown} className="w-full max-w-xl bg-white rounded-card shadow-pop overflow-hidden">
            <div className="flex items-center gap-3 px-4 border-b border-line">
              <Search size={16} className="text-muted flex-none" aria-hidden />
              <input ref={input} role="combobox" aria-expanded aria-controls={listId} aria-activedescendant={rows[idx] ? `${listId}-${idx}` : undefined} aria-label="Search pages, projects and certifications" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages, projects, certifications" className="flex-1 h-12 outline-none text-sm text-ink placeholder:text-muted bg-transparent" />
              <kbd className="text-xs text-body border border-line rounded px-1.5">Esc</kbd>
            </div>
            <ul id={listId} role="listbox" className="max-h-[50vh] overflow-auto p-2 list-none m-0">
              {error && <li className="px-3 py-6 text-sm text-center">Search is unavailable right now.</li>}
              {!error && result && rows.length === 0 && <li className="px-3 py-6 text-sm text-center">Nothing matches &ldquo;{q}&rdquo;.</li>}
              {rows.map((r, i) => (
                <li key={r.key} id={`${listId}-${i}`} role="option" aria-selected={i === idx} onMouseMove={() => setIdx(i)} onClick={() => go(r)} className={cx("flex items-center gap-3 px-3 min-h-11 rounded-control cursor-pointer text-sm", i === idx ? "bg-surface" : "")}>
                  <span className="text-muted flex-none" aria-hidden>
                    {r.kind === "cert" ? <Award size={16} /> : r.kind === "project" ? <FileText size={16} /> : <Search size={16} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="text-ink font-medium truncate block">{r.label}</span>
                    {r.sub && <span className="text-xs truncate block">{r.sub}</span>}
                  </span>
                  <span className="text-xs text-muted capitalize">{r.kind === "cert" ? "Certification" : r.kind}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

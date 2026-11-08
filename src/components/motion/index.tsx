"use client";

import { AnimatePresence, LayoutGroup, MotionConfig, animate, motion, useInView, useMotionValue, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { DUR, EASE, STAGGER, fadeUp, layoutTransition, listItem } from "@/lib/motion";

export { AnimatePresence, LayoutGroup, motion, useReducedMotion };

/** Wrap the app once: honours prefers-reduced-motion for every motion component. */
export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: DUR.ui, ease: EASE }}>
      {children}
    </MotionConfig>
  );
}

/** Fade-up on route change. Keyed by pathname so each page animates in. */
export function PageTransition({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <motion.div key={path} initial="hidden" animate="show" variants={fadeUp}>
      {children}
    </motion.div>
  );
}

/** Children rise in one after another, 40ms apart. */
export function Stagger({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={className} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: STAGGER, delayChildren: delay } } }}>
      {Children.map(children, (c) => (c ? <motion.div variants={listItem}>{c}</motion.div> : null))}
    </motion.div>
  );
}

/** For custom lists: use inside a parent that sets staggered variants. */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={listItem} className={className}>
      {children}
    </motion.div>
  );
}

/** Fade-up once when scrolled into view. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : undefined} transition={{ duration: DUR.page, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

/** Counts up when it enters the viewport. The final value is always in the DOM for tests and screen readers. */
export function CountUp({ value, decimals = 0, prefix = "", suffix = "", className }: { value: number; decimals?: number; prefix?: string; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (reduce || !inView) return;
    const c = animate(mv, value, { duration: 1.1, ease: EASE, onUpdate: (v) => setShown(v) });
    return () => c.stop();
  }, [inView, value, reduce, mv]);
  const fmt = (n: number) => `${prefix}${n.toLocaleString("en-CA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  return (
    <span ref={ref} className={className} data-value={value}>
      <span aria-hidden>{fmt(reduce ? value : shown)}</span>
      <span className="sr-only">{fmt(value)}</span>
    </span>
  );
}

/** Circular ring that draws from 0 to value (0 to 100). */
export function AnimatedRing({ value, size = 56, stroke = 5, label, children, tone = "brand" }: { value: number; size?: number; stroke?: number; label?: string; children?: ReactNode; tone?: "brand" | "ok" | "ink" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const color = tone === "ok" ? "var(--color-ok)" : tone === "ink" ? "var(--color-ink)" : "var(--color-brand)";
  return (
    <span role="img" aria-label={label ?? `${v} out of 100`} className="relative inline-grid place-items-center flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - v / 100) }} transition={{ duration: 0.9, ease: EASE }} />
      </svg>
      <span aria-hidden className="absolute inset-0 grid place-items-center text-ink font-semibold" style={{ fontSize: size * 0.3 }}>
        {children ?? v}
      </span>
    </span>
  );
}

/** Horizontal bar that grows from 0. */
export function AnimatedBar({ value, max = 100, tone = "brand", label, height = 6 }: { value: number; max?: number; tone?: "brand" | "ok" | "ink"; label?: string; height?: number }) {
  const pct = max === 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const color = tone === "ok" ? "bg-ok" : tone === "ink" ? "bg-ink" : "bg-brand";
  return (
    <div role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max} aria-label={label} style={{ height }} className="bg-line rounded-full overflow-hidden">
      <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: EASE }} />
    </div>
  );
}

/** A checkmark that draws itself. */
export function DrawCheck({ size = 24, stroke = 2.5, className, delay = 0 }: { size?: number; stroke?: number; className?: string; delay?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: EASE, delay }} />
    </svg>
  );
}

/** The sliding pill behind the active nav item. Render it inside the active item (which must be position: relative). */
export function SharedNavIndicator({ id = "nav-indicator", className = "absolute inset-0 rounded-control bg-surface -z-10" }: { id?: string; className?: string }) {
  return <motion.span layoutId={id} className={className} transition={layoutTransition} aria-hidden />;
}

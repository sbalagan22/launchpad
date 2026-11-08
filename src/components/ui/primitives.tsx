"use client";

import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { motion } from "motion/react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cx, initials } from "@/lib/utils";
import { t, layoutTransition } from "@/lib/motion";

export { cx };

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover border border-transparent",
  secondary: "bg-white text-ink border border-line hover:bg-surface hover:border-line-strong",
  ghost: "bg-transparent text-body border border-transparent hover:text-ink hover:bg-surface",
  danger: "bg-white text-bad border border-line hover:bg-bad-bg",
};

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> & {
  variant?: Variant;
  size?: "md" | "sm";
  loading?: boolean;
  href?: string;
  full?: boolean;
  external?: boolean;
};

const MotionLink = motion.create(Link);

/** Buttons press down to 97% and ease back. Touch targets are at least 40px (36px for sm with padding around it). */
export function Button({ variant = "primary", size = "md", loading, href, full, external, className, children, disabled, ...rest }: ButtonProps) {
  const cls = cx(
    "inline-flex items-center justify-center gap-2 rounded-control font-semibold text-sm transition-colors duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed",
    size === "md" ? "h-10 px-4 min-w-10" : "h-9 px-3",
    full && "w-full",
    VARIANT[variant],
    variant === "primary" ? "[a&]:text-white" : "[a&]:text-ink",
    className,
  );
  const press = { whileTap: { scale: 0.97 }, transition: t.hover };
  if (href) {
    const props = external ? { target: "_blank", rel: "noreferrer" } : {};
    return (
      <MotionLink href={href} className={cls} {...press} {...props}>
        {children}
      </MotionLink>
    );
  }
  return (
    <motion.button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} whileTap={disabled || loading ? undefined : press.whileTap} transition={press.transition} {...rest}>
      {loading && <Loader2 size={16} className="animate-spin-slow" aria-hidden />}
      {children}
    </motion.button>
  );
}

/** Cards lift 2px on hover when `lift` is set (use for clickable cards). */
export function Card({ className, children, lift, as: Tag = "div", ...rest }: { className?: string; children: ReactNode; lift?: boolean; as?: "div" | "section" | "article" } & HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cx("border border-line rounded-card bg-white", lift && "transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:shadow-float hover:border-line-strong", className)} {...rest}>
      {children}
    </Tag>
  );
}

export type Tone = "neutral" | "brand" | "ok" | "warn" | "bad" | "ink";
const TONE: Record<Tone, string> = {
  neutral: "bg-surface text-body border-line",
  brand: "bg-tint text-brand-press border-tint font-semibold",
  ok: "bg-ok-bg text-ok border-ok-bg",
  warn: "bg-warn-bg text-warn border-warn-bg",
  bad: "bg-bad-bg text-bad border-bad-bg",
  ink: "bg-ink text-white border-ink",
};
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-lg border w-fit whitespace-nowrap", TONE[tone], className)}>{children}</span>;
}

/** Toggle chip, removable chip, or static tag. */
export function Chip({ children, onRemove, active, onClick, layoutId }: { children: ReactNode; onRemove?: () => void; active?: boolean; onClick?: () => void; layoutId?: string }) {
  if (onClick)
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={cx("text-sm font-medium px-4 min-h-10 rounded-control border transition-colors duration-150 cursor-pointer", active ? "border-brand bg-tint text-brand-press font-semibold" : "border-line bg-white text-ink hover:border-line-strong")}>
        {children}
      </button>
    );
  if (onRemove)
    return (
      <motion.span layout layoutId={layoutId} transition={layoutTransition} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="inline-flex">
        <button type="button" onClick={onRemove} aria-label={`Remove ${typeof children === "string" ? children : "filter"}`} className="inline-flex items-center gap-1 text-sm font-medium px-2 min-h-8 rounded-control border border-line text-ink hover:bg-surface cursor-pointer">
          {children}
          <X size={14} className="text-body" aria-hidden />
        </button>
      </motion.span>
    );
  return <span className="text-xs px-2 py-0.5 rounded-lg border border-line text-body bg-white whitespace-nowrap">{children}</span>;
}

/** Shimmering placeholder. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("rounded-control bg-[linear-gradient(90deg,var(--color-line)_25%,#f3f3f5_50%,var(--color-line)_75%)] bg-[length:200%_100%] animate-shimmer", className)} />;
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <span role="status" aria-label="Loading" style={{ width: size, height: size }} className="inline-block border-2 border-line border-t-brand rounded-full animate-spin-slow" />;
}

export function ProgressBar({ value, tone = "brand", label }: { value: number; tone?: "brand" | "ok"; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-1.5 bg-line rounded-full overflow-hidden">
      <motion.div className={cx("h-full rounded-full", tone === "ok" ? "bg-ok" : "bg-brand")} initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label, size = "md", id = "seg" }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string; size?: "md" | "sm"; id?: string }) {
  return (
    <div role="group" aria-label={label} className={cx("inline-flex border border-line rounded-control p-0.5 font-medium", size === "md" ? "text-sm" : "text-xs font-semibold")}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} className={cx("relative rounded-md cursor-pointer transition-colors duration-150", size === "md" ? "px-4 min-h-9" : "px-2 min-h-8", value === o.value ? "text-ink" : "text-body hover:text-ink")}>
          {value === o.value && <motion.span layoutId={`${id}-pill`} transition={layoutTransition} className="absolute inset-0 rounded-md bg-surface -z-0" aria-hidden />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Initials avatar. Pass tone="brand" for a red tile (York Verified, founders). */
export function Avatar({ name, size = 40, tone = "neutral" }: { name: string; size?: number; tone?: "neutral" | "brand" | "ink" }) {
  const toneCls = tone === "brand" ? "bg-brand text-white border-brand" : tone === "ink" ? "bg-ink text-white border-ink" : "bg-surface text-ink border-line";
  return (
    <span aria-hidden style={{ width: size, height: size, fontSize: size * 0.36 }} className={cx("inline-grid place-items-center rounded-control border font-semibold flex-none", toneCls)}>
      {initials(name)}
    </span>
  );
}

/** Kept for existing call sites. */
export function Monogram({ name, size = 40 }: { name: string; size?: number }) {
  return <Avatar name={name} size={size} />;
}

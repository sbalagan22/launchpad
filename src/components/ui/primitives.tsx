import Link from "next/link";
import { Loader2, X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover border border-transparent",
  secondary: "bg-white text-ink border border-line hover:bg-surface hover:border-line-strong",
  ghost: "bg-transparent text-body border border-transparent hover:text-ink hover:bg-surface",
  danger: "bg-white text-bad border border-line hover:bg-bad-bg",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "md" | "sm"; loading?: boolean; href?: string; full?: boolean; external?: boolean };

export function Button({ variant = "primary", size = "md", loading, href, full, external, className, children, disabled, ...rest }: ButtonProps) {
  const cls = cx(
    "inline-flex items-center justify-center gap-2 rounded-control font-semibold text-sm transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed",
    size === "md" ? "h-10 px-4" : "h-8 px-3",
    full && "w-full",
    VARIANT[variant],
    className,
  );
  if (href) {
    const props = external ? { target: "_blank", rel: "noreferrer" } : {};
    return (
      <Link href={href} className={cx(cls, variant === "primary" ? "text-white" : "text-ink")} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Loader2 size={16} className="animate-spin-slow" aria-hidden />}
      {children}
    </button>
  );
}

export function Card({ className, children, as: Tag = "div", ...rest }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cx("border border-line rounded-card bg-white", className)} {...rest}>
      {children}
    </Tag>
  );
}

type Tone = "neutral" | "brand" | "ok" | "warn" | "bad";
const TONE: Record<Tone, string> = {
  neutral: "bg-surface text-body border-line",
  brand: "bg-tint text-brand border-tint",
  ok: "bg-ok-bg text-ok border-ok-bg",
  warn: "bg-warn-bg text-warn border-warn-bg",
  bad: "bg-bad-bg text-bad border-bad-bg",
};
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 text-xs font-medium px-2 rounded-lg border w-fit whitespace-nowrap", TONE[tone], className)}>{children}</span>;
}

export function Chip({ children, onRemove, active, onClick }: { children: ReactNode; onRemove?: () => void; active?: boolean; onClick?: () => void }) {
  if (onClick)
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={cx("text-sm font-medium px-4 py-2 rounded-control border transition-colors cursor-pointer", active ? "border-brand bg-tint text-brand" : "border-line bg-white text-ink hover:border-line-strong")}>
        {children}
      </button>
    );
  if (onRemove)
    return (
      <button type="button" onClick={onRemove} aria-label={`Remove ${typeof children === "string" ? children : "item"}`} className="inline-flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-control border border-line text-ink hover:bg-surface cursor-pointer">
        {children}
        <X size={16} className="text-body" aria-hidden />
      </button>
    );
  return <span className="text-xs px-2 rounded-lg border border-line text-body bg-white whitespace-nowrap">{children}</span>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("bg-line/70 rounded-control animate-pulse-soft", className)} />;
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <span role="status" aria-label="Loading" style={{ width: size, height: size }} className="inline-block border-2 border-line border-t-brand rounded-full animate-spin-slow" />;
}

export function ProgressBar({ value, tone = "brand", label }: { value: number; tone?: "brand" | "ok"; label?: string }) {
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-1 bg-line rounded-sm">
      <div className={cx("h-full rounded-sm transition-[width] duration-500", tone === "ok" ? "bg-ok" : "bg-brand")} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label, size = "md" }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string; size?: "md" | "sm" }) {
  return (
    <div role="group" aria-label={label} className={cx("inline-flex border border-line rounded-control p-0.5 font-medium", size === "md" ? "text-sm" : "text-xs font-semibold")}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} className={cx("rounded-md cursor-pointer transition-colors", size === "md" ? "px-4 py-1" : "px-2 py-1", value === o.value ? "bg-surface text-ink" : "text-body hover:text-ink")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Monogram({ name, size = 40 }: { name: string; size?: number }) {
  const letters = name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return (
    <span aria-hidden style={{ width: size, height: size, fontSize: size * 0.36 }} className="inline-grid place-items-center rounded-control border border-line bg-surface text-ink font-semibold flex-none">
      {letters}
    </span>
  );
}

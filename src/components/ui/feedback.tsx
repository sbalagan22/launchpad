import type { ReactNode } from "react";
import { AlertTriangle, Inbox, ShieldCheck, Sparkles, Star } from "lucide-react";
import { TRUST_LABEL, type Trust } from "@/schemas";
import { Button, Card, Skeleton, cx } from "./primitives";

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-line-strong rounded-card px-6 py-12 text-center flex flex-col items-center gap-2">
      <Inbox size={24} className="text-muted" aria-hidden />
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {body && <p className="text-sm max-w-sm">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div role="alert" className="border border-line rounded-card px-6 py-12 text-center flex flex-col items-center gap-2 bg-bad-bg/40">
      <AlertTriangle size={24} className="text-bad" aria-hidden />
      <h3 className="text-base font-semibold text-ink">Something went wrong</h3>
      <p className="text-sm max-w-md">{error.message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}

export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" role="status" className="flex flex-col gap-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <Card className="p-6 flex flex-col gap-4 mt-4">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </Card>
    </div>
  );
}

/** Shown beside every AI output. */
export function AiNote({ source, className }: { source?: "real" | "mock"; className?: string }) {
  return (
    <p className={cx("flex items-center gap-2 text-xs text-body", className)} data-testid="ai-note">
      <Sparkles size={14} className="text-brand flex-none" aria-hidden />
      AI-generated, please review{source === "mock" ? "" : source === "real" ? " (live model)" : ""}.
    </p>
  );
}

const SHIELD = "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z";

/** The design's trust glyph: filled shield (issuer verified), outlined shield with tick (skill checked), plain outline (self-reported). */
export function TrustBadge({ trust, showLabel = true }: { trust: Trust; showLabel?: boolean }) {
  const colour = trust === "self" ? "text-body" : "text-brand";
  return (
    <span className={cx("inline-flex items-center gap-2 text-xs font-medium whitespace-nowrap", colour)} data-trust={trust}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill={trust === "issuer" ? "#635BFF" : "none"} stroke={trust === "self" ? "#8792A2" : "#635BFF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={SHIELD} />
        {trust !== "self" && <path d="m9 12 2 2 4-4" stroke={trust === "issuer" ? "#fff" : "#635BFF"} fill="none" />}
      </svg>
      {showLabel ? TRUST_LABEL[trust] : <span className="sr-only">{TRUST_LABEL[trust]}</span>}
    </span>
  );
}

export function MatchPill({ percent }: { percent: number }) {
  return <span className="font-semibold text-ink" aria-label={`${percent} percent match`}>{percent}%</span>;
}

export function Stars({ value, onChange, size = 28 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div role={onChange ? "radiogroup" : "img"} aria-label={onChange ? "Rating" : `${value} of 5`} className="flex gap-2 items-center">
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star size={size} fill={n <= value ? "#635BFF" : "none"} stroke={n <= value ? "#635BFF" : "#8792A2"} strokeWidth={1.5} aria-hidden />;
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => onChange(n)} className="cursor-pointer p-0 bg-transparent border-0">
            {icon}
          </button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
    </div>
  );
}

export { ShieldCheck };

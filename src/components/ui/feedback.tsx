"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Check, Inbox, Loader2, Sparkles, Star, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedRing, DrawCheck } from "@/components/motion";
import { Button, Card, Skeleton, cx } from "./primitives";
import { t } from "@/lib/motion";

export function EmptyState({ title, body, action, icon }: { title: string; body?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="border border-dashed border-line-strong rounded-card px-6 py-12 text-center flex flex-col items-center gap-2">
      <span className="text-muted">{icon ?? <Inbox size={24} aria-hidden />}</span>
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

export function CardSkeletons({ n = 3 }: { n?: number }) {
  return (
    <div aria-busy="true" role="status" aria-label="Loading" className="flex flex-col gap-4">
      {Array.from({ length: n }, (_, i) => (
        <Card key={i} className="p-6 flex gap-4">
          <Skeleton className="h-12 w-12 flex-none" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Shown beside every AI output. */
export function AiNote({ source, className }: { source?: "real" | "mock"; className?: string }) {
  return (
    <p className={cx("flex items-center gap-2 text-xs text-body", className)} data-testid="ai-note">
      <Sparkles size={14} className="text-brand flex-none" aria-hidden />
      AI-generated, please review{source === "real" ? " (live model)" : ""}.
    </p>
  );
}

/** "What happens next" panel used under every action that changes state. */
export function WhatNext({ steps, title = "What happens next" }: { steps: string[]; title?: string }) {
  return (
    <aside aria-label={title} className="border border-line rounded-card bg-surface p-4">
      <h3 className="text-sm font-semibold text-ink mb-2">{title}</h3>
      <ol className="flex flex-col gap-2 text-sm list-none p-0 m-0">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-white border border-line text-xs font-semibold text-ink grid place-items-center flex-none mt-0.5">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

export type TrustLevel = "issuer" | "reviewed" | "self";
export const TRUST_TEXT: Record<TrustLevel, string> = { issuer: "Issuer verified", reviewed: "Approved by poster", self: "Not verified" };

/** Issuer verified and reviewer approved: red filled check. Self-reported: gray outline, "Not verified". */
export function TrustBadge({ trust, showLabel = true }: { trust: TrustLevel; showLabel?: boolean }) {
  const verified = trust !== "self";
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap", verified ? "text-brand-press" : "text-body font-medium")} data-trust={trust}>
      <span aria-hidden className={cx("w-4 h-4 rounded-full grid place-items-center flex-none", verified ? "bg-brand text-white" : "border border-muted text-muted")}>
        {verified && <Check size={11} strokeWidth={3.5} />}
      </span>
      {showLabel ? TRUST_TEXT[trust] : <span className="sr-only">{TRUST_TEXT[trust]}</span>}
    </span>
  );
}

/** Marks YSpace ventures. Verification is shown as a separate Founder verified label elsewhere. */
export function YSpaceBadge({ label = "YSpace venture" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap text-white bg-brand rounded-lg px-2 py-0.5" data-testid="yspace-badge">
      <span aria-hidden className="w-3.5 h-3.5 rounded-sm bg-white text-brand grid place-items-center text-[9px] font-bold leading-none">Y</span>
      {label}
    </span>
  );
}

export function MatchRing({ score, size = 48 }: { score: number; size?: number }) {
  return (
    <span data-testid="match-ring" data-score={score} className="inline-flex flex-none">
      <AnimatedRing value={score} size={size} stroke={size > 44 ? 5 : 4} label={`Match score ${score} out of 100`}>
        {score}
        <span className="text-[0.6em] font-medium">%</span>
      </AnimatedRing>
    </span>
  );
}

export type StepState = "pending" | "running" | "ok" | "failed";
/** Vertical stepper with animated state changes. Used for verification and onboarding. */
export function Stepper({ steps, label }: { steps: { id: string; label: string; state: StepState; detail?: string }[]; label: string }) {
  return (
    <ol aria-label={label} className="flex flex-col gap-3 list-none p-0 m-0" data-testid="stepper">
      {steps.map((s, i) => (
        <li key={s.id} data-state={s.state} className="flex gap-3 items-start">
          <span className="flex flex-col items-center flex-none">
            <span className={cx("w-6 h-6 rounded-full grid place-items-center text-xs font-semibold border transition-colors duration-250", s.state === "ok" ? "bg-brand border-brand text-white" : s.state === "failed" ? "bg-bad border-bad text-white" : s.state === "running" ? "border-brand text-brand bg-white" : "border-line-strong text-muted bg-white")}>
              {s.state === "ok" ? <DrawCheck size={14} stroke={3} /> : s.state === "failed" ? <X size={14} strokeWidth={3} aria-hidden /> : s.state === "running" ? <Loader2 size={14} className="animate-spin-slow" aria-hidden /> : i + 1}
            </span>
            {i < steps.length - 1 && <span className="w-px flex-1 min-h-4 bg-line mt-1" aria-hidden />}
          </span>
          <div className="pb-1">
            <p className={cx("text-sm", s.state === "pending" ? "text-muted" : "text-ink font-semibold")}>{s.label}</p>
            {s.detail && <p className="text-xs">{s.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Badge unlock: scale in, one ring pulse, check draw. No confetti. */
export function BadgeUnlock({ skill, onDone }: { skill: string; onDone?: () => void }) {
  return (
    <motion.div data-testid="badge-unlock" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col items-center gap-3 text-center" onAnimationComplete={onDone}>
      <span className="relative w-24 h-24 grid place-items-center">
        <motion.span aria-hidden className="absolute inset-0 rounded-full border-2 border-brand" initial={{ scale: 0.8, opacity: 0.9 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }} />
        <span className="w-20 h-20 rounded-full bg-brand text-white grid place-items-center">
          <DrawCheck size={40} stroke={3} delay={0.3} />
        </span>
      </span>
      <p className="text-lg font-semibold text-ink">{skill}</p>
      <p className="text-sm">Reviewer approved</p>
    </motion.div>
  );
}

export function Stars({ value, onChange, size = 28 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div role={onChange ? "radiogroup" : "img"} aria-label={onChange ? "Rating" : `${value} of 5`} className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star size={size} fill={n <= value ? "var(--color-brand)" : "none"} stroke={n <= value ? "var(--color-brand)" : "var(--color-muted)"} strokeWidth={1.5} aria-hidden />;
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => onChange(n)} className="cursor-pointer p-1 bg-transparent border-0 min-w-8 min-h-8 grid place-items-center">
            {icon}
          </button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
    </div>
  );
}

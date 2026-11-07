"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { useState } from "react";
import type { CheckResult } from "@/schemas";
import { AiNote, Badge, Card, ProgressBar, Spinner, cx } from "@/components/ui";

export const CHECK_STEPS = ["Reaching the site", "Measuring mobile performance", "Running accessibility checks", "Checking search basics", "Writing the summary"];
const STEP_MS = 700;

type Level = "ok" | "warn" | "bad";
const score = (n: number): Level => (n >= 85 ? "ok" : n >= 70 ? "warn" : "bad");
const load = (s: number | null): Level => (s === null ? "bad" : s < 2.5 ? "ok" : s < 4 ? "warn" : "bad");
const ICON = { ok: <Check size={16} className="text-ok" aria-label="Good" />, warn: <AlertTriangle size={16} className="text-warn" aria-label="Needs attention" />, bad: <X size={16} className="text-bad" aria-label="Failed" /> };

function Row({ name, value, level, first }: { name: string; value: string; level: Level; first?: boolean }) {
  return (
    <div className={cx("flex justify-between items-center text-sm py-2", !first && "border-t border-line")}>
      <span className="flex gap-2 items-center">{ICON[level]}{name}</span>
      <b className="font-semibold text-ink">{value}</b>
    </div>
  );
}

/** Step-by-step progress animation. Calls onDone after the last step. */
function Progress({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });
  useEffect(() => {
    const id = setInterval(() => setStep((s) => s + 1), STEP_MS);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { if (step >= CHECK_STEPS.length) done.current(); }, [step]);
  return (
    <ol className="flex flex-col gap-4 list-none p-0 m-0" aria-label="Check progress" data-testid="check-progress">
      {CHECK_STEPS.map((t, i) => (
        <li key={t} className={cx("flex gap-4 items-center text-sm transition-opacity", i <= step ? "text-ink opacity-100" : "opacity-50")}>
          <span className="w-4 h-4 grid place-items-center">{i < step ? <Check size={16} className="text-ok" aria-hidden /> : i === step ? <Spinner size={14} /> : null}</span>
          {t}
          {i < step && <span className="sr-only">done</span>}
        </li>
      ))}
    </ol>
  );
}

export function CheckPanel({ running, onAnimationDone, check, submittedUrl }: { running: boolean; onAnimationDone: () => void; check: CheckResult | null; submittedUrl?: string }) {
  const verdict = check ? (check.status === "pass" ? { tone: "ok" as const, label: "Passed" } : check.status === "warn" ? { tone: "warn" as const, label: "Needs attention" } : { tone: "bad" as const, label: "Failed" }) : null;
  return (
    <Card className="p-6" aria-live="polite">
      <div className="flex justify-between items-center mb-4">
        <b className="text-base font-semibold text-ink">Automated check</b>
        {running ? <Badge tone="brand">Running</Badge> : verdict && <Badge tone={verdict.tone}>{verdict.label}</Badge>}
      </div>
      {running ? (
        <Progress onDone={onAnimationDone} />
      ) : !check ? (
        <p className="text-sm">No check yet. When you submit a link, Launchpad checks that it loads, works on mobile, and meets basic accessibility and search standards.</p>
      ) : (
        <div data-testid="check-result">
          <div className="text-xs break-all mb-2">{submittedUrl ?? check.url}</div>
          <div className="flex flex-col mb-4">
            <Row first name="Site reachable" value={check.reachable ? `Yes (${check.httpStatus})` : `No (${check.httpStatus})`} level={check.reachable ? "ok" : "bad"} />
            <Row name="Loads on mobile" value={check.loadSeconds === null ? "n/a" : `${check.loadSeconds.toFixed(1)} s`} level={load(check.loadSeconds)} />
            <Row name="Mobile performance" value={`${check.mobile} / 100`} level={score(check.mobile)} />
            <Row name="Accessibility" value={`${check.accessibility} / 100`} level={score(check.accessibility)} />
            <Row name="SEO basics" value={`${check.seo} / 100`} level={score(check.seo)} />
          </div>
          <ProgressBar value={check.accessibility} tone={score(check.accessibility) === "ok" ? "ok" : "brand"} label="Accessibility score" />
          <div className="text-xs mt-1 mb-6">Accessibility score, {check.accessibility} of 100</div>
          {check.issues.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-medium mb-2">To fix</div>
              <ul className="text-sm list-disc pl-5 flex flex-col gap-1">{check.issues.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          )}
          <div className="border-t border-line pt-4">
            <div className="text-xs font-medium mb-2">Summary</div>
            <p className="text-sm leading-relaxed">{check.summary}</p>
            <AiNote className="mt-2" />
          </div>
        </div>
      )}
    </Card>
  );
}

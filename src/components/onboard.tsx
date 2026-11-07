import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Logo } from "@/components/nav";
import { Button, cx } from "@/components/ui";

/** Two-column onboarding layout from the design: step rail on the left, one question per step on the right. */
export function OnboardShell({ heading, steps, step, title, sub, children, onNext, onBack, nextLabel, nextDisabled, loading }: {
  heading: string; steps: string[]; step: number; title: string; sub: string; children: ReactNode;
  onNext: () => void; onBack: () => void; nextLabel: string; nextDisabled?: boolean; loading?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-wrap">
      <aside className="flex-[1_1_320px] bg-surface md:border-r border-b md:border-b-0 border-line px-6 md:px-12 py-8">
        <div className="mb-16"><Logo /></div>
        <div className="text-xs font-medium mb-4">{heading}</div>
        <ol className="flex flex-col gap-4 list-none p-0 m-0">
          {steps.map((label, i) => (
            <li key={label} aria-current={i === step ? "step" : undefined} className={cx("flex gap-4 items-center text-sm", i === step ? "font-semibold text-ink" : i < step ? "text-ink" : "text-body")}>
              <span className={cx("w-4 h-4 rounded border grid place-items-center", i < step ? "border-brand bg-brand text-white" : i === step ? "border-ink" : "border-muted")}>{i < step && <Check size={12} aria-hidden />}</span>
              {label}
            </li>
          ))}
        </ol>
      </aside>
      <section className="flex-[2_1_480px] px-6 md:px-12 pt-16 md:pt-24 pb-12">
        <div className="max-w-[560px]">
          <div className="text-xs font-medium mb-2">Step {step + 1} of {steps.length}</div>
          <h1 className="h2 mb-2">{title}</h1>
          <p className="mb-8">{sub}</p>
          <div className="mb-12">{children}</div>
          <div className="flex gap-4 items-center">
            <Button onClick={onNext} disabled={nextDisabled} loading={loading}>{nextLabel}</Button>
            <Button variant="secondary" onClick={onBack} className={step === 0 ? "invisible" : ""} aria-hidden={step === 0} tabIndex={step === 0 ? -1 : 0}>Back</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { Logo } from "@/components/nav";
import { Button, Card, Stepper } from "@/components/ui";

/** Shared frame for sign-up flows: stepper on the side, one question at a time. */
export function OnboardShell({ heading, steps, step, title, sub, children, onNext, onBack, nextLabel = "Continue", loading, nextDisabled }: { heading: string; steps: string[]; step: number; title: string; sub: string; children: ReactNode; onNext: () => void; onBack: () => void; nextLabel?: string; loading?: boolean; nextDisabled?: boolean }) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[880px] mx-auto px-6 py-10">
        <Logo />
        <h1 className="h2 mt-10 mb-6">{heading}</h1>
        <div className="grid md:grid-cols-[220px_1fr] gap-8 items-start">
          <Stepper label="Sign-up progress" steps={steps.map((s, i) => ({ id: s, label: s, state: i < step ? "ok" : i === step ? "running" : "pending" }))} />
          <Card className="p-8">
            <h2 className="h3 mb-1">{title}</h2>
            <p className="text-sm mb-6">{sub}</p>
            {children}
            <div className="flex justify-between mt-8">
              <Button variant="ghost" onClick={onBack} disabled={step === 0}>Back</Button>
              <Button onClick={onNext} loading={loading} disabled={nextDisabled} data-testid="onboard-next">{nextLabel}</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ErrorState } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-[720px] mx-auto px-8 py-24">
      <ErrorState error={error} onRetry={reset} />
    </div>
  );
}

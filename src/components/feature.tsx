import type { Project, ProjectStatus } from "@/schemas";
import { Badge } from "@/components/ui";
import { fmtDate } from "@/lib/dates";
import { money } from "@/lib/pay";

export const payLabel = (p: Project) => (p.payType === "volunteer" ? "Volunteer" : money(p.pay));
export const dueLabel = (iso: string) => fmtDate(iso);

const STATUS: Record<ProjectStatus, { label: string; tone: "neutral" | "brand" | "warn" | "ok" }> = {
  open: { label: "Open", tone: "neutral" },
  in_progress: { label: "In progress", tone: "brand" },
  in_review: { label: "In review", tone: "warn" },
  completed: { label: "Done", tone: "ok" },
};
export function StatusBadge({ status }: { status: ProjectStatus }) {
  const s = STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs">{label}</div>
      <div className="text-xl font-semibold text-ink tracking-[-0.02em] leading-tight">{value}</div>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-ink mb-2">{children}</h2>;
}

export function pct(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

export function milestoneProgress(p: Project) {
  const done = p.milestones.filter((m) => m.status === "approved").length;
  return { done, total: p.milestones.length, percent: p.status === "completed" ? 100 : pct(done, p.milestones.length) };
}

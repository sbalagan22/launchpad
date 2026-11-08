"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Send } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { AnimatePresence, CountUp, Stagger, StaggerItem, motion } from "@/components/motion";
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, MatchRing, PageSkeleton, Select, YSpaceBadge, toast } from "@/components/ui";
import { useMe } from "@/components/use-me";
import { useQuery } from "@/hooks/use-query";
import { approvals, pipeline, projects, type PipelineCardView } from "@/services";
import { layoutTransition } from "@/lib/motion";

const STAGE_LABEL = { applied: "Applied", interviewing: "Interviewing", trial: "Trial", offer: "Offer" } as const;
type Stage = keyof typeof STAGE_LABEL;

export default function Founder() {
  const { user, kind, hydrated } = useMe();
  const bid = user?.business?.id ?? null;
  const stats = useQuery(bid ? `fstats:${bid}` : null, () => projects.businessStats());
  const pipe = useQuery(bid ? `pipe:${bid}` : null, () => pipeline.getPipeline(bid!));
  const pend = useQuery(bid ? `fpend:${bid}` : null, () => approvals.pending());

  if (hydrated && user && kind !== "founder") return <PageContainer><EmptyState title="This dashboard is for founders" body="Switch to the founder account to see the hiring pipeline." action={<Button href="/login">Switch demo account</Button>} /></PageContainer>;
  if (pipe.error) return <PageContainer><ErrorState error={pipe.error} onRetry={pipe.refetch} /></PageContainer>;
  if (!stats.data || !pipe.data) return <PageContainer><PageSkeleton rows={4} /></PageContainer>;
  const s = stats.data;
  const cards: [string, number, number?][] = [["Posted", s.posted], ["Active", s.active], ["Completed", s.completed], ["Candidates", s.candidates], ["Student hours", s.studentHours], ["Average review", s.averageReview, 1]];
  return (
    <PageContainer>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div><div className="flex items-center gap-2 flex-wrap"><h1 className="h1">{user?.business?.name}</h1><YSpaceBadge /></div><p className="mt-1">Welcome back, {user?.displayName.split(" ")[0]}.</p></div>
        <Button href="/business/new">Post a project</Button>
      </div>
      <Stagger className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {cards.map(([label, value, d]) => <StaggerItem key={label}><Card className="p-5"><div className="text-xs mb-1">{label}</div><div className="text-3xl font-semibold tracking-[-0.02em] text-ink"><CountUp value={value} decimals={d ?? 0} /></div></Card></StaggerItem>)}
      </Stagger>

      {(pend.data?.length ?? 0) > 0 && (
        <Card className="p-5 mb-8 flex flex-wrap items-center justify-between gap-3" data-testid="pending-banner">
          <div><b className="text-ink font-semibold">{pend.data!.length} milestone{pend.data!.length === 1 ? "" : "s"} waiting for your approval</b><p className="text-sm">{pend.data![0].student.name} submitted {pend.data![0].milestone.title}.</p></div>
          <Button href="/business/approvals">Review <ArrowRight size={16} aria-hidden /></Button>
        </Card>
      )}

      <h2 className="h3 mb-3">Hiring pipeline</h2>
      <Pipeline cards={pipe.data.cards} stages={pipe.data.stages as Stage[]} />
      <p className="text-xs mt-4"><Link href="/business">All projects</Link> &middot; <Link href="/impact">Impact</Link></p>
    </PageContainer>
  );
}

function Pipeline({ cards, stages }: { cards: PipelineCardView[]; stages: Stage[] }) {
  if (cards.length === 0) return <EmptyState title="No candidates yet" body="Students who apply to your projects appear here." />;
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="pipeline">
      {stages.map((st) => {
        const col = cards.filter((c) => c.entry.stage === st);
        return (
          <section key={st} aria-label={`${STAGE_LABEL[st]}, ${col.length} candidates`} className="bg-surface rounded-card p-3 min-h-[160px]" data-testid={`col-${st}`}>
            <h3 className="text-sm font-semibold text-ink px-1 mb-3 flex justify-between"><span>{STAGE_LABEL[st]}</span><span className="text-body font-medium" data-testid={`count-${st}`}>{col.length}</span></h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {col.map((c) => <motion.li key={c.entry.id} layout transition={layoutTransition} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><CandidateCard c={c} /></motion.li>)}
              </AnimatePresence>
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function CandidateCard({ c }: { c: PipelineCardView }) {
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState(false);
  const move = async (stage: Stage) => {
    setBusy(true);
    try { await pipeline.moveCandidate(c.entry.id, stage); toast.success(`${c.student.name} moved to ${STAGE_LABEL[stage]}`); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not move"); } finally { setBusy(false); }
  };
  const sendInvite = async () => {
    if (!c.application) return;
    setInvite(true);
    try { await pipeline.inviteToContinue(c.application.id); toast.success(`Invite to continue sent to ${c.student.name}`); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not send invite"); } finally { setInvite(false); }
  };
  return (
    <Card className="p-3" data-testid="candidate" data-name={c.student.name}>
      <div className="flex items-start gap-3">
        <Avatar name={c.student.name} size={36} />
        <div className="min-w-0 flex-1">
          <Link href={`/u/${c.student.slug}`} className="text-sm font-semibold text-ink! block truncate">{c.student.name}</Link>
          <p className="text-xs truncate">{c.project.title}</p>
        </div>
        <MatchRing score={c.match.score} size={36} />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Select label="Move to stage" hideLabel value={c.entry.stage} disabled={busy} onChange={(e) => move(e.target.value as Stage)} options={(Object.keys(STAGE_LABEL) as Stage[]).map((s) => ({ value: s, label: `Move to ${STAGE_LABEL[s]}` }))} />
        {c.entry.invite ? <Badge tone="brand">Invite {c.entry.invite.status === "pending" ? "sent, pending" : c.entry.invite.status}</Badge> : c.canInvite ? <Button size="sm" variant="secondary" onClick={sendInvite} loading={invite} data-testid="invite-btn"><Send size={14} aria-hidden />Invite to continue</Button> : null}
      </div>
    </Card>
  );
}

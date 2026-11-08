"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "@/components/motion";
import { PageContainer } from "@/components/nav";
import { ProjectCardView } from "@/components/project-card";
import { Button, CardSkeletons, Chip, Drawer, EmptyState, ErrorState, Segmented, Select, toast, cx } from "@/components/ui";
import { useQuery } from "@/hooks/use-query";
import { projects, type ProjectFilters } from "@/services";
import { EMPLOYER_LABEL, type Difficulty, type EmployerType, type Faculty, type LocationMode } from "@/schemas";
import { layoutTransition } from "@/lib/motion";

const FACULTIES: Faculty[] = ["Lassonde", "Schulich", "LA&PS", "AMPD", "Science", "Health", "Education", "EUC", "Glendon"];
const SKILLS = ["React", "Python", "SQL", "Figma", "Excel", "Writing", "Research", "Canva", "Testing"];
const HOURS = [{ v: "", l: "Any length" }, { v: "10", l: "Up to 10 hours" }, { v: "15", l: "Up to 15 hours" }, { v: "20", l: "Up to 20 hours" }];
const DEADLINES = [{ v: "", l: "Any deadline" }, { v: "14", l: "Within 2 weeks" }, { v: "30", l: "Within a month" }, { v: "60", l: "Within 2 months" }];
const toggle = <T,>(list: T[] | undefined, v: T): T[] | undefined => { const n = list?.includes(v) ? list.filter((x) => x !== v) : [...(list ?? []), v]; return n.length ? n : undefined; };
const deadlineISO = (days: string) => (days ? new Date(Date.now() + Number(days) * 86_400_000).toISOString() : undefined);

function FeedInner() {
  const params = useSearchParams();
  const cert = params.get("cert");
  const employer = params.get("employer") as EmployerType | null;
  const [tab, setTab] = useState<"all" | "saved">("all");
  const [f, setF] = useState<ProjectFilters>({ sort: "match", ...(cert ? { strengthenedBy: [cert] } : {}), ...(employer ? { employerType: [employer] } : {}) });
  const [q, setQ] = useState("");
  const [hours, setHours] = useState("");
  const [deadline, setDeadline] = useState("");
  const [panel, setPanel] = useState(false);
  const [shown, setShown] = useState(8);

  const filters = useMemo<ProjectFilters>(() => ({ ...f, status: ["open"], q: q.trim() || undefined, maxHours: hours ? Number(hours) : undefined, deadlineBefore: deadlineISO(deadline) }), [f, q, hours, deadline]);
  const all = useQuery(tab === "all" ? `feed:${JSON.stringify(filters)}` : null, () => projects.list(filters));
  const saved = useQuery(tab === "saved" ? "feed:saved" : null, () => projects.listSaved());
  const items = tab === "all" ? all.data?.items : saved.data;
  const active = tab === "all" ? all : saved;

  const chips: { key: string; label: string; remove: () => void }[] = [
    ...(f.faculty ?? []).map((v) => ({ key: `fa:${v}`, label: v, remove: () => setF((s) => ({ ...s, faculty: s.faculty?.filter((x) => x !== v) })) })),
    ...(f.employerType ?? []).map((v) => ({ key: `em:${v}`, label: EMPLOYER_LABEL[v], remove: () => setF((s) => ({ ...s, employerType: s.employerType?.filter((x) => x !== v) })) })),
    ...(f.payType ?? []).map((v) => ({ key: `pt:${v}`, label: v === "stipend" ? "Stipend" : "Volunteer", remove: () => setF((s) => ({ ...s, payType: s.payType?.filter((x) => x !== v) })) })),
    ...(f.skills ?? []).map((v) => ({ key: `sk:${v}`, label: v, remove: () => setF((s) => ({ ...s, skills: s.skills?.filter((x) => x !== v) })) })),
    ...(f.difficulty ?? []).map((v) => ({ key: `df:${v}`, label: v, remove: () => setF((s) => ({ ...s, difficulty: s.difficulty?.filter((x) => x !== v) })) })),
    ...(f.locationMode ?? []).map((v) => ({ key: `lm:${v}`, label: v === "on_campus" ? "On campus" : v === "hybrid" ? "Hybrid" : "Remote", remove: () => setF((s) => ({ ...s, locationMode: s.locationMode?.filter((x) => x !== v) })) })),
    ...(f.strengthenedBy ?? []).map((v) => ({ key: `ce:${v}`, label: `Strengthened by ${v}`, remove: () => setF((s) => ({ ...s, strengthenedBy: undefined })) })),
    ...(hours ? [{ key: "hours", label: HOURS.find((h) => h.v === hours)!.l, remove: () => setHours("") }] : []),
    ...(deadline ? [{ key: "deadline", label: DEADLINES.find((d) => d.v === deadline)!.l, remove: () => setDeadline("") }] : []),
  ];
  const clear = () => { setF({ sort: f.sort }); setHours(""); setDeadline(""); setQ(""); setShown(8); };
  const onSave = async (id: string, isSaved: boolean) => {
    try { await (isSaved ? projects.unsave(id) : projects.save(id)); toast.success(isSaved ? "Removed from saved" : "Saved for later"); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update saved projects"); }
  };

  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div><h1 className="h1 mb-2">Projects</h1><p>Scoped work with clear deliverables, hours and pay. Ranked by how well it matches you.</p></div>
        <Segmented id="feed-tab" label="Feed" value={tab} onChange={setTab} options={[{ value: "all", label: "All projects" }, { value: "saved", label: "Saved" }]} />
      </div>

      {tab === "all" && (
        <div className="sticky top-16 z-10 bg-white/95 backdrop-blur py-3 -mx-1 px-1 mb-4 border-b border-line">
          <div className="flex gap-2 items-center flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input aria-label="Search projects" type="search" placeholder="Search by title, skill or poster" value={q} onChange={(e) => { setQ(e.target.value); setShown(8); }} className="w-full h-11 rounded-control border border-line bg-white pl-10 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand outline-none" />
            </div>
            <div className="w-44"><Select label="Sort by" hideLabel value={f.sort ?? "match"} onChange={(e) => setF((s) => ({ ...s, sort: e.target.value as ProjectFilters["sort"] }))} options={[{ value: "match", label: "Best match" }, { value: "newest", label: "Newest" }, { value: "deadline", label: "Deadline" }, { value: "pay", label: "Pay" }]} /></div>
            <Button variant="secondary" onClick={() => setPanel(true)} aria-haspopup="dialog" data-testid="open-filters" className="h-11">
              <SlidersHorizontal size={16} aria-hidden />Filters
              {chips.length > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-brand text-white text-xs font-bold inline-grid place-items-center">{chips.length}</span>}
            </Button>
          </div>
          <LayoutGroup>
            <div className="flex items-center gap-2 flex-wrap mt-3 min-h-8" aria-live="polite">
              <span className="text-sm text-ink font-medium" data-testid="result-count">{items ? `${items.length} ${items.length === 1 ? "project" : "projects"}` : "Loading projects"}</span>
              <AnimatePresence mode="popLayout">{chips.map((c) => <Chip key={c.key} layoutId={c.key} onRemove={c.remove}>{c.label}</Chip>)}</AnimatePresence>
              {chips.length > 0 && <motion.span layout transition={layoutTransition}><Button variant="ghost" size="sm" onClick={clear}>Clear all</Button></motion.span>}
            </div>
          </LayoutGroup>
        </div>
      )}

      {active.error ? <ErrorState error={active.error} onRetry={active.refetch} /> : active.loading || !items ? <CardSkeletons n={4} /> : items.length === 0 ? (
        tab === "saved" ? <EmptyState title="Nothing saved yet" body="Tap the bookmark on any project to keep it here." action={<Button variant="secondary" onClick={() => setTab("all")}>Browse projects</Button>} /> : <EmptyState title="No projects match these filters" body="Try removing a filter or widening the hours range." action={<Button variant="secondary" onClick={clear}>Clear all filters</Button>} />
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence initial>
            {items.slice(0, shown).map((c, i) => (
              <motion.div key={c.project.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }} exit={{ opacity: 0 }}><ProjectCardView card={c} onToggleSave={onSave} /></motion.div>
            ))}
          </AnimatePresence>
          {items.length > shown && <div className="flex justify-center pt-2"><Button variant="secondary" onClick={() => setShown((n) => n + 8)} data-testid="load-more">Load more ({items.length - shown} more)</Button></div>}
        </div>
      )}

      <Drawer open={panel} onClose={() => setPanel(false)} title="Filters" width={420}>
        <div className="flex flex-col gap-7 pb-24">
          <h2 className="h3">Filters</h2>
          <Group title="Poster type">
            {(Object.keys(EMPLOYER_LABEL) as EmployerType[]).map((v) => <Opt key={v} on={f.employerType?.includes(v)} onClick={() => setF((s) => ({ ...s, employerType: toggle(s.employerType, v) }))}>{EMPLOYER_LABEL[v]}</Opt>)}
          </Group>
          <Group title="Pay">
            {([["stipend", "Stipend"], ["volunteer", "Volunteer"]] as const).map(([v, l]) => <Opt key={v} on={f.payType?.includes(v)} onClick={() => setF((s) => ({ ...s, payType: toggle(s.payType, v) }))}>{l}</Opt>)}
          </Group>
          <Group title="Faculty">
            {FACULTIES.map((v) => <Opt key={v} on={f.faculty?.includes(v)} onClick={() => setF((s) => ({ ...s, faculty: toggle(s.faculty, v) }))}>{v}</Opt>)}
          </Group>
          <Group title="Skills">
            {SKILLS.map((v) => <Opt key={v} on={f.skills?.includes(v)} onClick={() => setF((s) => ({ ...s, skills: toggle(s.skills, v) }))}>{v}</Opt>)}
          </Group>
          <Group title="Difficulty">
            {(["Beginner", "Intermediate", "Advanced"] as Difficulty[]).map((v) => <Opt key={v} on={f.difficulty?.includes(v)} onClick={() => setF((s) => ({ ...s, difficulty: toggle(s.difficulty, v) }))}>{v}</Opt>)}
          </Group>
          <Group title="Location">
            {([["remote", "Remote"], ["hybrid", "Hybrid"], ["on_campus", "On campus"]] as [LocationMode, string][]).map(([v, l]) => <Opt key={v} on={f.locationMode?.includes(v)} onClick={() => setF((s) => ({ ...s, locationMode: toggle(s.locationMode, v) }))}>{l}</Opt>)}
          </Group>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Time commitment" value={hours} onChange={(e) => setHours(e.target.value)} options={HOURS.map((h) => ({ value: h.v, label: h.l }))} />
            <Select label="Deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} options={DEADLINES.map((d) => ({ value: d.v, label: d.l }))} />
          </div>
        </div>
        <div className="fixed bottom-0 right-0 w-full max-w-[420px] bg-white border-t border-line p-4 flex gap-2 justify-between">
          <Button variant="ghost" onClick={clear} disabled={chips.length === 0}>Clear all</Button>
          <Button onClick={() => setPanel(false)} data-testid="apply-filters">Show {all.data ? `${all.data.items.length} ` : ""}projects</Button>
        </div>
      </Drawer>
    </PageContainer>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="border-0 p-0 m-0"><legend className="text-sm font-semibold text-ink mb-2">{title}</legend><div className="flex flex-wrap gap-2">{children}</div></fieldset>;
}
function Opt({ on, onClick, children }: { on?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" role="checkbox" aria-checked={Boolean(on)} onClick={onClick} className={cx("min-h-10 px-3 rounded-control border text-sm cursor-pointer transition-colors", on ? "border-brand bg-tint text-brand-press font-semibold" : "border-line bg-white text-body hover:bg-surface")}>{children}</button>;
}

export default function Feed() {
  return <Suspense><FeedInner /></Suspense>;
}

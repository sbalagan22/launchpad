"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "@/components/motion";
import { PageContainer } from "@/components/nav";
import { ProjectCardView } from "@/components/project-card";
import { Button, CardSkeletons, Chip, EmptyState, ErrorState, Input, Segmented, Select, toast } from "@/components/ui";
import { useQuery } from "@/hooks/use-query";
import { projects, type ProjectFilters } from "@/services";
import { EMPLOYER_LABEL, type EmployerType, type Faculty } from "@/schemas";
import { layoutTransition } from "@/lib/motion";

const FACULTIES: Faculty[] = ["Lassonde", "Schulich", "LA&PS", "AMPD", "Science", "Health", "Education", "EUC", "Glendon"];
const SKILLS = ["React", "Figma", "Python", "SQL", "Copywriting", "Social media", "Excel", "Brand design"];
const DEADLINES = [
  { value: "", label: "Any deadline" },
  { value: "14", label: "Within 2 weeks" },
  { value: "30", label: "Within a month" },
];

const toggle = <T,>(list: T[] | undefined, v: T): T[] => (list?.includes(v) ? list.filter((x) => x !== v) : [...(list ?? []), v]);

function deadlineISO(days: string): string | undefined {
  if (!days) return undefined;
  return new Date(Date.now() + Number(days) * 86_400_000).toISOString();
}

export default function Feed() {
  const [tab, setTab] = useState<"all" | "saved">("all");
  const [f, setF] = useState<ProjectFilters>({ sort: "match" });
  const [q, setQ] = useState("");
  const [hours, setHours] = useState("");
  const [deadline, setDeadline] = useState("");

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
    ...(hours ? [{ key: "hours", label: `Up to ${hours} hours`, remove: () => setHours("") }] : []),
    ...(deadline ? [{ key: "deadline", label: DEADLINES.find((d) => d.value === deadline)!.label, remove: () => setDeadline("") }] : []),
  ];
  const clear = () => (setF({ sort: f.sort }), setHours(""), setDeadline(""), setQ(""));

  const onSave = async (id: string, isSaved: boolean) => {
    try {
      await (isSaved ? projects.unsave(id) : projects.save(id));
      toast.success(isSaved ? "Removed from saved" : "Saved for later");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update saved projects");
    }
  };

  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="h1 mb-2">Projects</h1>
          <p>Scoped work with clear deliverables, hours and pay. Ranked by how well it matches your skills.</p>
        </div>
        <Segmented id="feed-tab" label="Feed" value={tab} onChange={setTab} options={[{ value: "all", label: "All projects" }, { value: "saved", label: "Saved" }]} />
      </div>

      {tab === "all" && (
        <section aria-label="Filters" className="sticky top-16 z-10 bg-white/95 backdrop-blur border border-line rounded-card p-4 mb-6 flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Search" placeholder="Title, skill or poster" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select label="Max hours" value={hours} onChange={(e) => setHours(e.target.value)} options={[{ value: "", label: "Any length" }, { value: "10", label: "Up to 10 hours" }, { value: "15", label: "Up to 15 hours" }, { value: "20", label: "Up to 20 hours" }]} />
            <Select label="Deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} options={DEADLINES} />
            <Select label="Sort by" value={f.sort ?? "match"} onChange={(e) => setF((s) => ({ ...s, sort: e.target.value as ProjectFilters["sort"] }))} options={[{ value: "match", label: "Best match" }, { value: "yield", label: "Skill yield" }, { value: "newest", label: "Newest" }, { value: "deadline", label: "Deadline" }]} />
          </div>
          <FilterRow label="Faculty" options={FACULTIES.map((v) => ({ v, label: v }))} selected={f.faculty} onToggle={(v) => setF((s) => ({ ...s, faculty: toggle(s.faculty, v) }))} />
          <FilterRow label="Poster" options={(Object.keys(EMPLOYER_LABEL) as EmployerType[]).map((v) => ({ v, label: EMPLOYER_LABEL[v] }))} selected={f.employerType} onToggle={(v) => setF((s) => ({ ...s, employerType: toggle(s.employerType, v) }))} />
          <FilterRow label="Pay" options={[{ v: "stipend" as const, label: "Stipend" }, { v: "volunteer" as const, label: "Volunteer" }]} selected={f.payType} onToggle={(v) => setF((s) => ({ ...s, payType: toggle(s.payType, v) }))} />
          <FilterRow label="Skills" options={SKILLS.map((v) => ({ v, label: v }))} selected={f.skills} onToggle={(v) => setF((s) => ({ ...s, skills: toggle(s.skills, v) }))} />
          <LayoutGroup>
            <div className="flex items-center gap-2 flex-wrap min-h-8" aria-live="polite">
              <span className="text-sm flex items-center gap-1 text-ink font-medium">
                <SlidersHorizontal size={14} aria-hidden /> {chips.length === 0 ? "No filters applied" : `${chips.length} ${chips.length === 1 ? "filter" : "filters"}`}
              </span>
              <AnimatePresence mode="popLayout">
                {chips.map((c) => (
                  <Chip key={c.key} layoutId={c.key} onRemove={c.remove}>
                    {c.label}
                  </Chip>
                ))}
              </AnimatePresence>
              {chips.length > 0 && (
                <motion.span layout transition={layoutTransition}>
                  <Button variant="ghost" size="sm" onClick={clear}>
                    Clear all
                  </Button>
                </motion.span>
              )}
            </div>
          </LayoutGroup>
        </section>
      )}

      <p className="text-sm mb-3" aria-live="polite" data-testid="result-count">
        {items ? `${items.length} ${items.length === 1 ? "project" : "projects"}` : "Loading projects"}
      </p>

      {active.error ? (
        <ErrorState error={active.error} onRetry={active.refetch} />
      ) : active.loading || !items ? (
        <CardSkeletons n={4} />
      ) : items.length === 0 ? (
        tab === "saved" ? (
          <EmptyState title="Nothing saved yet" body="Tap the bookmark on any project to keep it here." action={<Button variant="secondary" onClick={() => setTab("all")}>Browse projects</Button>} />
        ) : (
          <EmptyState title="No projects match these filters" body="Try removing a filter or widening the hours range." action={<Button variant="secondary" onClick={clear}>Clear all filters</Button>} />
        )
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence initial>
            {items.map((c, i) => (
              <motion.div key={c.project.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }} exit={{ opacity: 0 }}>
                <ProjectCardView card={c} onToggleSave={onSave} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </PageContainer>
  );
}

function FilterRow<T extends string>({ label, options, selected, onToggle }: { label: string; options: { v: T; label: string }[]; selected: T[] | undefined; onToggle: (v: T) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap" role="group" aria-label={label}>
      <span className="text-xs font-medium w-14 flex-none">{label}</span>
      {options.map((o) => (
        <Chip key={o.v} active={selected?.includes(o.v)} onClick={() => onToggle(o.v)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, Landmark, Lightbulb, Rocket, Store } from "lucide-react";
import { Badge, Button, Card, Skeleton, YSpaceBadge, MatchRing, TrustBadge } from "@/components/ui";
import { Reveal, Stagger } from "@/components/motion";
import { useQuery } from "@/hooks/use-query";
import { certs, projects, startups } from "@/services";
import { EMPLOYER_LABEL } from "@/schemas";
import { money, shortDate } from "@/lib/utils";

const STEPS = [
  ["01", "Describe the need", "Posters write what they need in plain words. Launchpad turns it into a scoped brief with deliverables, milestones, hours, pay and acceptance criteria."],
  ["02", "Apply and build", "Students apply with a short proposal, chat with the poster, and submit a link for each milestone."],
  ["03", "Get reviewed, keep the evidence", "The poster checks the work against the acceptance criteria and rates it. Approved projects become skill evidence on a public profile."],
];

const EMPLOYERS = [
  { icon: Landmark, title: "York units and clubs", body: "Student clubs and campus offices that need a site, a data clean-up or an event kit." },
  { icon: GraduationCap, title: "Professors and labs", body: "Research groups that need a dashboard, a survey tool or a literature table." },
  { icon: Lightbulb, title: "Student and alumni founders", body: "Early teams that need a landing page or an onboarding flow before launch." },
  { icon: Store, title: "Local businesses", body: "Cafes, studios and shops around Keele and Glendon with a small, well-defined job." },
  { icon: Building2, title: "Nonprofits", body: "Community groups that need a newsletter template or a volunteer sign-up page." },
  { icon: Rocket, title: "YSpace startups", body: "Ventures from York's startup community that hire students and invite the best to continue." },
];

function HeroListing() {
  const { data, loading } = useQuery("landing:hero", () => projects.list({ sort: "newest" }));
  const card = data?.items[0];
  if (loading) return <Skeleton className="h-80 w-full" />;
  if (!card) return null;
  const p = card.project;
  return (
    <Card as="article" className="overflow-hidden shadow-float" aria-label="Live listing">
      <div className="px-6 py-3 border-b border-line bg-surface text-xs font-medium flex items-center justify-between gap-2">
        <span>Live listing, scoped from a plain-text request</span>
        {card.isNew && <Badge tone="brand">New</Badge>}
      </div>
      <div className="p-6">
        <div className="text-xs mb-1 flex items-center gap-2 flex-wrap">
          {card.business.name} &middot; {card.business.city}
          {card.venture && <YSpaceBadge />}
        </div>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink mb-2">{p.title}</h2>
        <p className="text-sm mb-4">{p.hook}</p>
        <div className="flex gap-8 mb-4 text-sm flex-wrap">
          {[
            ["Estimate", `${p.hours} hours`],
            [p.payType === "stipend" ? "Stipend" : "Volunteer", p.payType === "stipend" ? money(p.pay) : "Unpaid"],
            ["Deadline", shortDate(p.deadline)],
          ].map(([l, v]) => (
            <div key={l}>
              <div className="text-xs">{l}</div>
              <b className="text-ink font-semibold">{v}</b>
            </div>
          ))}
        </div>
        {p.milestones.map((m, i) => (
          <div key={m.id} className="flex justify-between gap-4 py-2 border-t border-line text-sm">
            <span className="text-ink">
              {i + 1}. {m.title}
            </span>
            <span>{m.amount ? money(m.amount) : `${m.hours}h`}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FeaturedListings() {
  const { data, loading } = useQuery("landing:featured", () => projects.list({ sort: "newest" }));
  const items = data?.items.slice(0, 3) ?? [];
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-48" />)}
      {items.map((c) => (
        <Link key={c.project.id} href={`/projects/${c.project.id}`} className="text-body! hover:text-body!">
          <Card lift className="p-6 h-full flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span>{c.business.name}</span>
              {c.venture && <YSpaceBadge />}
            </div>
            <h3 className="text-lg font-semibold text-ink tracking-[-0.02em]">{c.project.title}</h3>
            <p className="text-sm flex-1">{c.project.hook}</p>
            <div className="flex justify-between text-sm pt-2 border-t border-line">
              <span>{c.project.hours} hours</span>
              <b className="text-ink font-semibold">{c.project.payType === "stipend" ? money(c.project.pay) : "Volunteer"}</b>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function StartupBand() {
  const { data, loading } = useQuery("landing:ventures", () => startups.listVentures());
  const items = data?.slice(0, 3) ?? [];
  return (
    <section className="bg-ink text-white" aria-labelledby="startups-h">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <div className="max-w-xl">
              <h2 id="startups-h" className="text-[28px] sm:text-[40px] leading-[1.15] tracking-[-0.02em] font-semibold mb-3 text-white">Build with York&apos;s startups</h2>
              <p className="text-white/80">Work on a real product with a founder, get your work approved by the founder, and if it goes well, get invited to continue.</p>
            </div>
            <Button href="/projects?employer=yspace_startup" variant="secondary">
              See startup projects <ArrowRight size={16} aria-hidden />
            </Button>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-4">
          {loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-44 opacity-30" />)}
          {items.map((v) => (
            <Link key={v.id} href={`/startups/${v.id}`} className="text-ink! hover:text-ink!">
              <Card lift className="p-6 h-full flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-ink">{v.name}</h3>
                  {v.yspaceVerified && <YSpaceBadge />}
                </div>
                <p className="text-sm text-body flex-1">{v.pitch}</p>
                <p className="text-xs text-body">
                  {v.openProjectCount} open {v.openProjectCount === 1 ? "project" : "projects"} &middot; {v.stack.slice(0, 3).join(", ")}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CertPreview() {
  const { data, loading } = useQuery("landing:certs", () => certs.catalog());
  const items = data?.slice(0, 4) ?? [];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {loading && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}
      {items.map((c) => (
        <Link key={c.id} href="/certifications" className="text-body! hover:text-body!">
          <Card lift className="p-4 h-full flex flex-col gap-1">
            <span className="text-xs">{c.issuer}</span>
            <h3 className="text-base font-semibold text-ink">{c.name}</h3>
            <span className="text-xs mt-auto pt-2">{c.costUsd === null ? "Free" : `$${c.costUsd}`} &middot; {c.studyHours} study hours</span>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function Landing() {
  return (
    <div>
      <section className="bg-gradient-to-b from-white to-surface border-b border-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-16 md:py-24 flex flex-wrap gap-12 items-center">
          <div className="flex-[1_1_440px] min-w-0">
            <p className="mb-4"><Badge tone="brand">For York students</Badge></p>
            <h1 className="text-[40px] sm:text-[60px] leading-[1.05] tracking-[-0.02em] font-semibold mb-6 text-ink">Your first real experience, reviewed by York.</h1>
            <p className="text-xl mb-8 max-w-[500px]">Scoped projects from campus units, local businesses, nonprofits and YSpace startups. Finish one and keep the evidence.</p>
            <div className="flex gap-3 flex-wrap mb-8">
              <Button href="/onboarding/student">I&apos;m a student</Button>
              <Button href="/business/new" variant="secondary">I need help with a project</Button>
            </div>
            <p className="text-sm max-w-[440px] pt-4 border-t border-line flex items-center gap-2 flex-wrap">
              <TrustBadge trust="reviewed" /> means the poster approved the work. Anything a student types stays <TrustBadge trust="self" />.
            </p>
          </div>
          <div className="flex-[1_1_440px] min-w-0">
            <HeroListing />
          </div>
        </div>
      </section>

      <section id="how" className="max-w-[1200px] mx-auto px-6 md:px-8 py-20 flex flex-wrap gap-12">
        <div className="flex-[1_1_280px] min-w-0">
          <h2 className="text-[28px] sm:text-[40px] leading-[1.15] tracking-[-0.02em] font-semibold mb-4 text-ink">How it works</h2>
          <p className="max-w-[320px]">Three steps from a rough request to work you can show.</p>
        </div>
        <ol className="flex-[2_1_480px] min-w-0 list-none p-0 m-0">
          {STEPS.map(([n, title, d]) => (
            <Reveal key={n}>
              <li className="flex gap-8 py-8 border-t border-line">
                <div className="text-[28px] font-semibold tracking-[-0.02em] text-brand w-12 flex-none">{n}</div>
                <div className="min-w-0">
                  <div className="text-xl font-semibold tracking-[-0.02em] text-ink mb-2">{title}</div>
                  <div>{d}</div>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="bg-surface border-y border-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-20">
          <h2 className="text-[28px] sm:text-[40px] leading-[1.15] tracking-[-0.02em] font-semibold mb-3 text-ink">Who posts projects</h2>
          <p className="mb-10 max-w-xl">Six kinds of poster, each with a clear label so students know who they are working for.</p>
          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EMPLOYERS.map((e) => (
              <Card key={e.title} className="p-6 h-full">
                <e.icon size={20} className="text-brand mb-3" aria-hidden />
                <h3 className="text-base font-semibold text-ink mb-1">{e.title}</h3>
                <p className="text-sm">{e.body}</p>
              </Card>
            ))}
          </Stagger>
          <p className="text-xs mt-4">Labels used in the product: {Object.values(EMPLOYER_LABEL).join(", ")}.</p>
        </div>
      </section>

      <StartupBand />

      <section className="max-w-[1200px] mx-auto px-6 md:px-8 py-20">
        <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
          <h2 className="text-[28px] sm:text-[40px] leading-[1.15] tracking-[-0.02em] font-semibold text-ink">Featured listings</h2>
          <Button href="/projects" variant="secondary">Browse all projects</Button>
        </div>
        <FeaturedListings />
      </section>

      <section className="bg-surface border-y border-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-20">
          <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h2 className="text-[28px] sm:text-[40px] leading-[1.15] tracking-[-0.02em] font-semibold mb-2 text-ink">Certifications that strengthen your applications</h2>
              <p className="max-w-xl">Verified with the issuer, never graded by Launchpad. Prices checked Nov 2026, confirm with the issuer.</p>
            </div>
            <Button href="/certifications" variant="secondary">Open the catalog</Button>
          </div>
          <CertPreview />
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 md:px-8 py-20 text-center">
        <h2 className="text-[28px] sm:text-[40px] leading-[1.15] tracking-[-0.02em] font-semibold mb-4 text-ink">Start with one small project.</h2>
        <p className="max-w-lg mx-auto mb-8">Pick something that fits your week. Ten to twenty hours is typical.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button href="/onboarding/student">Create a student profile</Button>
          <Button href="/login" variant="secondary">Try a demo role</Button>
        </div>
      </section>
    </div>
  );
}

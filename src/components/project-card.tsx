"use client";

import Link from "next/link";
import { Bookmark, Clock } from "lucide-react";
import { Badge, Card, MatchRing, SkillYieldRing, YSpaceBadge, cx } from "@/components/ui";
import { EMPLOYER_LABEL } from "@/schemas";
import type { ProjectCard as Card_ } from "@/services";
import { money, shortDate } from "@/lib/utils";

export const payText = (p: Card_["project"]) => (p.payType === "volunteer" ? (p.sponsorStipend ? `Volunteer, ${money(p.sponsorStipend)} sponsor stipend` : "Volunteer") : money(p.pay));

export function ProjectCardView({ card, onToggleSave }: { card: Card_; onToggleSave?: (id: string, saved: boolean) => void }) {
  const p = card.project;
  return (
    <Card as="article" lift className="p-6 relative" data-testid="project-card" data-project-id={p.id}>
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-xs mb-1">
            <span>{card.business.name}</span>
            <span aria-hidden>&middot;</span>
            <span>{EMPLOYER_LABEL[card.business.employerType]}</span>
            {card.venture && <YSpaceBadge />}
            {card.isNew && <Badge tone="brand">New</Badge>}
            {card.myApplication && <Badge tone="ok">Applied</Badge>}
          </div>
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">
            <Link href={`/projects/${p.id}`} className="text-ink! hover:text-brand! after:absolute after:inset-0 after:content-['']">
              {p.title}
            </Link>
          </h3>
          <p className="text-sm mt-1 mb-3 line-clamp-2">{p.hook}</p>
          <div className="flex gap-x-6 gap-y-1 flex-wrap text-sm">
            <span className="flex items-center gap-1">
              <Clock size={14} aria-hidden /> {p.hours} hours
            </span>
            <b className="text-ink font-semibold">{payText(p)}</b>
            <span>Due {shortDate(p.deadline)}</span>
          </div>
          <div className="flex gap-1 flex-wrap mt-3">
            {p.skills.slice(0, 5).map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-lg border border-line bg-white">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 flex-none relative z-10">
          {card.match && (
            <div className="flex flex-col items-center text-xs gap-1">
              <MatchRing score={card.match.score} />
              <span>Match</span>
            </div>
          )}
          <div className="flex flex-col items-center text-xs gap-1">
            <SkillYieldRing result={card.yield} size={40} />
            <span>Yield</span>
          </div>
        </div>
      </div>
      {onToggleSave && (
        <button type="button" onClick={() => onToggleSave(p.id, card.saved)} aria-pressed={card.saved} aria-label={card.saved ? `Remove ${p.title} from saved` : `Save ${p.title}`} className={cx("absolute bottom-4 right-4 z-10 w-10 h-10 grid place-items-center rounded-control border cursor-pointer transition-colors", card.saved ? "border-brand text-brand bg-tint" : "border-line text-body hover:bg-surface")}>
          <Bookmark size={16} fill={card.saved ? "currentColor" : "none"} aria-hidden />
        </button>
      )}
    </Card>
  );
}

"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ExternalLink, Pencil } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { Badge, Button, Card, EmptyState, ErrorState, Input, PageSkeleton, Select, Stars, Textarea, TrustBadge, toast } from "@/components/ui";
import { useQuery } from "@/hooks/use-query";
import { students, ServiceError } from "@/services";
import { fmtMonthYear } from "@/lib/dates";
import { AvailabilityPref, Level } from "@/schemas";
import type { ProfileView as Profile } from "@/schemas/views";

const subscribe = () => () => {};
const useOrigin = () => useSyncExternalStore(subscribe, () => window.location.host, () => "launchpad.app");

export function ProfilePage({ keyArg, editable, hydrated }: { keyArg: { id?: string; slug?: string }; editable: boolean; hydrated: boolean }) {
  const k = keyArg.id ?? keyArg.slug ?? "";
  const { data, error, loading, refetch } = useQuery(hydrated && k ? `profilev:${k}` : null, () => students.getProfile(keyArg));
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const host = useOrigin();

  if (error) return <PageContainer><ErrorState error={error} onRetry={refetch} /></PageContainer>;
  if (loading || !data) return <PageContainer><PageSkeleton rows={6} /></PageContainer>;
  const { student: s, completed, claims, badges } = data;
  const link = `${host}/u/${s.slug}`;
  const year = ["1st", "2nd", "3rd", "4th", "5th"][s.year - 1];
  const order = { issuer: 0, checked: 1, self: 2 } as const;
  const skills = [...s.skills].sort((a, b) => order[a.trust] - order[b.trust]);

  return (
    <PageContainer>
      <div className="flex justify-between items-center gap-4 text-xs font-medium mb-8 pb-4 border-b border-line">
        <span>{editable ? "This is your profile. Employers see the public view." : "Public view. This is what employers see."}</span>
        {editable && <span className="flex gap-4"><Link href={`/u/${s.slug}`} className="font-semibold">View public page</Link></span>}
      </div>

      {editing && editable ? (
        <EditForm profile={data} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-wrap gap-8 justify-between items-start mb-16">
          <div className="min-w-0 max-w-[640px]">
            <h1 className="text-[32px] sm:text-[40px] leading-[1.1] tracking-[-0.02em] font-semibold mb-2 text-ink">{s.name}</h1>
            <div>{year} year {s.field} · {s.school}</div>
            <div className="text-sm mt-1">{s.bio || "No bio yet."} {s.city && !s.bio.includes(s.city) ? `Based in ${s.city}, ON.` : ""}</div>
            <div className="text-sm mt-1">Available about {s.hoursPerWeek} hours a week · {s.pref === "both" ? "paid or volunteer" : s.pref === "paid" ? "paid projects" : "volunteer projects"}{s.portfolioUrl && <> · <a href={s.portfolioUrl} target="_blank" rel="noreferrer">Portfolio</a></>}</div>
            {editable && <div className="mt-4"><Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={16} aria-hidden />Edit profile</Button></div>}
          </div>
          <div className="flex gap-4 items-center border border-line rounded-card p-4">
            <QRCodeSVG value={`https://${link}`} size={96} marginSize={0} title={`QR code linking to ${s.name}'s public profile`} />
            <div>
              <div className="text-xs mb-1">Shareable link</div>
              <div className="text-sm font-medium text-ink mb-2 break-all">{link}</div>
              <Button size="sm" variant="secondary" onClick={() => { void navigator.clipboard?.writeText(`https://${link}`); setCopied(true); toast.success("Link copied."); setTimeout(() => setCopied(false), 1800); }}>{copied ? "Copied" : "Copy link"}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-16 items-start">
        <div className="flex-[2_1_480px] min-w-0">
          <div className="flex gap-8 mb-8 flex-wrap text-sm">
            <div><div className="text-xs">Verified hours</div><b className="text-xl text-ink font-semibold">{data.verifiedHours}</b></div>
            <div><div className="text-xs">Completed projects</div><b className="text-xl text-ink font-semibold">{completed.length}</b></div>
            <div><div className="text-xs">Verified badges</div><b className="text-xl text-ink font-semibold">{badges.length}</b></div>
          </div>
          <h2 className="h3 mb-4">Completed projects</h2>
          {completed.length === 0 ? <EmptyState title="No completed projects yet" body="Finished projects, reviews and evidence show up here." /> : completed.map(({ project: p, business, review, badges: b, submissionUrl }) => (
            <article key={p.id} className="border-t border-line py-6" data-testid="completed-project">
              <div className="flex justify-between gap-4 items-baseline mb-1"><b className="text-base font-semibold text-ink">{p.title}</b><span className="text-xs whitespace-nowrap">{p.hours} hours · {fmtMonthYear(review?.createdAt ?? p.deadline)}</span></div>
              <div className="text-sm mb-4">{business.name}, {business.city}</div>
              {review && (<><p className="text-base text-ink mb-2 max-w-[560px]">&ldquo;{review.text}&rdquo;</p><div className="text-sm mb-4 flex items-center gap-2">{review.by}, rated {review.rating} of 5 <Stars value={review.rating} size={14} /></div></>)}
              {b.length > 0 && <div className="flex gap-2 flex-wrap mb-3">{b.map((x) => <Badge key={x.id} tone="brand">{x.skill} badge</Badge>)}</div>}
              {submissionUrl && <a href={submissionUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold inline-flex gap-1 items-center">View final work<ExternalLink size={16} aria-hidden /></a>}
            </article>
          ))}
        </div>
        <div className="flex-[1_1_300px] min-w-0">
          <h2 className="h3 mb-4">Skills</h2>
          <div className="border border-line rounded-card overflow-hidden mb-8" data-testid="skills-list">
            {skills.map((k) => (
              <div key={k.name} className="px-4 py-2 border-t border-line first:border-t-0 text-sm" data-skill={k.name} data-trust={k.trust}>
                <div className="flex justify-between items-center gap-2"><span className="font-medium text-ink">{k.name}</span><TrustBadge trust={k.trust} /></div>
                {k.trust !== "self" && k.evidence.length > 0 && <ul className="text-xs mt-1 pl-4 list-disc">{k.evidence.map((e) => <li key={e.label}>{e.href ? <a href={e.href} target="_blank" rel="noreferrer">Evidence: {e.label}</a> : `Evidence: ${e.label}`}</li>)}</ul>}
              </div>
            ))}
          </div>
          <h2 className="h3 mb-4">Certifications</h2>
          {claims.length === 0 ? <EmptyState title="No certifications yet" /> : (
            <div className="flex flex-col gap-2">{claims.map(({ claim, cert }) => (
              <Card key={claim.id} className="p-4 flex justify-between gap-2 items-center"><div><div className="text-sm font-semibold text-ink">{cert.name}</div><div className="text-xs">{cert.provider}{cert.issuedVia ? ` · ${cert.issuedVia}` : ""} · {fmtMonthYear(claim.issuedAt)}</div></div>{claim.verified ? <TrustBadge trust={claim.tier} /> : <Badge tone="neutral">Unverified</Badge>}</Card>
            ))}</div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function EditForm({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const s = profile.student;
  const [bio, setBio] = useState(s.bio);
  const [field, setField] = useState(s.field);
  const [city, setCity] = useState(s.city);
  const [hours, setHours] = useState(String(s.hoursPerWeek));
  const [pref, setPref] = useState<string>(s.pref);
  const [portfolio, setPortfolio] = useState(s.portfolioUrl ?? "");
  const [skill, setSkill] = useState("");
  const [level, setLevel] = useState<string>("Intermediate");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true); setError(null);
    try {
      await students.updateStudent(s.id, { bio, field, city, hoursPerWeek: Number(hours), pref: AvailabilityPref.parse(pref), portfolioUrl: portfolio });
      toast.success("Profile saved.");
      onDone();
    } catch (e) { setError(e instanceof ServiceError ? e.message : "Could not save."); }
    finally { setBusy(false); }
  };
  const addSkill = async () => {
    if (!skill.trim()) return;
    try { await students.updateStudent(s.id, { addSkill: { name: skill, level: Level.parse(level) } }); setSkill(""); toast.info("Added as self-reported."); }
    catch (e) { toast.error(e instanceof ServiceError ? e.message : "Could not add skill."); }
  };

  return (
    <Card as="section" aria-label="Edit profile" className="p-6 mb-12 max-w-3xl">
      <h1 className="h2 mb-6">Edit profile</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Field of study" value={field} onChange={(e) => setField(e.target.value)} />
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label="Hours per week" type="number" min={1} max={40} value={hours} onChange={(e) => setHours(e.target.value)} />
        <Select label="Pay preference" value={pref} onChange={(e) => setPref(e.target.value)} options={[{ value: "both", label: "Paid or volunteer" }, { value: "paid", label: "Paid only" }, { value: "volunteer", label: "Volunteer only" }]} />
        <div className="sm:col-span-2"><Input label="Portfolio link" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://" error={error} /></div>
        <div className="sm:col-span-2"><Textarea label="Bio" rows={3} maxLength={400} value={bio} onChange={(e) => setBio(e.target.value)} /></div>
      </div>
      <h2 className="text-sm font-semibold text-ink mt-6 mb-2">Skills</h2>
      <p className="text-xs mb-2">New skills are self-reported. Only a project review, an issuer lookup or a skill check can raise the level.</p>
      <ul className="flex flex-wrap gap-2 mb-4 list-none p-0">
        {s.skills.map((k) => (
          <li key={k.name} className="flex items-center gap-2 border border-line rounded-control px-2 py-1 text-sm text-ink">{k.name}<TrustBadge trust={k.trust} showLabel={false} />{k.trust === "self" && <button type="button" aria-label={`Remove ${k.name}`} onClick={() => void students.updateStudent(s.id, { removeSkill: k.name })} className="text-body hover:text-bad cursor-pointer">×</button>}</li>
        ))}
      </ul>
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-40"><Input label="Add a skill" value={skill} onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void addSkill())} /></div>
        <Select label="Level" value={level} onChange={(e) => setLevel(e.target.value)} options={Level.options.map((l) => ({ value: l, label: l }))} />
        <Button variant="secondary" onClick={addSkill}>Add</Button>
      </div>
      <div className="flex gap-2 mt-8"><Button onClick={save} loading={busy}>Save changes</Button><Button variant="secondary" onClick={onDone}>Cancel</Button></div>
    </Card>
  );
}

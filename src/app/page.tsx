import Link from "next/link";
import Image from "next/image";
import { Button, TrustBadge } from "@/components/ui";
import type { Trust } from "@/schemas";

// Static marketing copy from the design export. No product data is read here.
const HERO_MS = [
  ["Design mockups in Figma", "$100"],
  ["Menu and hours pages built", "$150"],
  ["Order form, testing, launch", "$150"],
];
const HERO_SKILLS: [string, Trust][] = [["UX Design", "issuer"], ["HTML", "checked"], ["JavaScript", "self"]];
const STEPS = [
  ["01", "Build a profile", "Add your field of study and skills. Certifications are checked with the issuer and labeled by trust level."],
  ["02", "Complete a scoped project", "Every project lists deliverables, milestones, hours, and pay up front. Chat with the business and submit work for each milestone."],
  ["03", "Keep the evidence", "Automated checks, client reviews, and links to your work are attached to your public profile."],
];
const COMPARE = [
  ["Issuer verified", "Credential ID or URL confirmed with the organization that issued it.", "Courses and certificates", "Google UX Design, via Coursera"],
  ["Skill checked", "Demonstrated in a project the business reviewed, with an automated check on the result.", "Completed Launchpad projects", "CSS on a bakery website scoring 92 on accessibility"],
  ["Self-reported", "Added by the student. Not yet confirmed by anyone.", "Student profile", "JavaScript, added during sign up"],
];
const TABLE_SKILLS: [string, Trust][] = [["UX Design", "issuer"], ["HTML", "checked"], ["CSS", "checked"], ["Figma", "checked"], ["JavaScript", "self"]];

export default function Landing() {
  return (
    <div>
      <section className="bg-gradient-to-b from-white to-surface border-b border-line">
        <div className="max-w-[1200px] mx-auto px-8 py-24 flex flex-wrap gap-16 items-center">
          <div className="flex-[1_1_440px] min-w-0">
            <h1 className="text-[40px] sm:text-[64px] leading-[1.05] tracking-[-0.02em] font-semibold mb-6 text-ink">Your first real experience, verified.</h1>
            <p className="text-xl mb-8 max-w-[480px]">Complete real projects for local businesses. Earn skills employers can trust.</p>
            <div className="flex gap-4 flex-wrap mb-8">
              <Button href="/onboarding/student">I&apos;m a student</Button>
              <Button href="/business/new" variant="secondary">I&apos;m a business</Button>
            </div>
            <p className="text-sm max-w-[440px] pt-4 border-t border-line">Example: build a website for a local bakery, get a verified web development badge.</p>
          </div>
          <div className="flex-[1_1_440px] min-w-0" aria-hidden>
            <div className="bg-white border border-line rounded-card overflow-hidden">
              <div className="px-6 py-4 border-b border-line bg-surface text-xs font-medium">Scoped by Launchpad AI from: &quot;a simple website with our menu, hours, and an online order form&quot;</div>
              <div className="p-6">
                <div className="text-xs mb-1">Sunrise Bakery · Brampton</div>
                <div className="text-xl font-semibold tracking-[-0.02em] text-ink mb-4">Bakery website</div>
                <div className="flex gap-8 mb-6 text-sm flex-wrap">
                  {[["Estimate", "20 hours"], ["Stipend", "$400"], ["Deadline", "Dec 12"]].map(([l, v]) => (
                    <div key={l}><div className="text-xs">{l}</div><b className="text-ink font-semibold">{v}</b></div>
                  ))}
                </div>
                {HERO_MS.map(([t, a], i) => (
                  <div key={t} className="flex justify-between gap-4 py-2 border-t border-line text-sm"><span className="text-ink">{i + 1}. {t}</span><span>{a}</span></div>
                ))}
              </div>
            </div>
            <div className="mt-[-32px] ml-16 relative bg-white border border-line rounded-card px-6 py-4 shadow-float">
              <div className="flex justify-between items-baseline gap-2 mb-2"><b className="text-ink font-semibold">Aisha Khan</b><span className="text-xs">York University · Computer Science</span></div>
              {HERO_SKILLS.map(([n, t]) => (
                <div key={n} className="flex justify-between items-center py-2 border-t border-line text-sm"><span className="text-ink">{n}</span><TrustBadge trust={t} /></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="max-w-[1200px] mx-auto px-8 py-24 flex flex-wrap gap-16">
        <div className="flex-[1_1_280px] min-w-0"><h2 className="text-[28px] sm:text-[40px] leading-[1.15] tracking-[-0.02em] font-semibold mb-4 text-ink">How it works</h2><p className="max-w-[320px]">Three steps from an empty profile to work you can show.</p></div>
        <ol className="flex-[2_1_480px] min-w-0 list-none p-0 m-0">
          {STEPS.map(([n, t, d]) => (
            <li key={n} className="flex gap-8 py-8 border-t border-line">
              <div className="text-[28px] font-semibold tracking-[-0.02em] text-ink w-12 flex-none">{n}</div>
              <div className="min-w-0"><div className="text-xl font-semibold tracking-[-0.02em] text-ink mb-2">{t}</div><div>{d}</div></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-surface border-y border-line">
        <div className="max-w-[1200px] mx-auto px-8 py-24">
          <div className="flex flex-wrap gap-16 items-center mb-16">
            <div className="flex-[1_1_360px] min-w-0">
              <h2 className="text-[28px] sm:text-[40px] leading-[1.15] tracking-[-0.02em] font-semibold mb-4 text-ink">Every skill shows how it was proven.</h2>
              <p className="max-w-[440px] mb-6">Employers see a trust level next to each skill on a student&apos;s public profile. A certificate confirmed with its issuer is never mixed up with a skill the student typed in.</p>
              <Link href="/skills" className="text-sm font-semibold">See the verification flow</Link>
            </div>
            <div className="flex-[1_1_400px] min-w-0 bg-white border border-line rounded-card overflow-hidden">
              <div className="grid grid-cols-2 px-6 py-2 bg-surface border-b border-line text-xs font-medium"><span>Skill</span><span>Trust level</span></div>
              {TABLE_SKILLS.map(([n, t]) => (
                <div key={n} className="grid grid-cols-2 items-center px-6 py-2 border-t border-line first:border-t-0 text-sm"><span className="text-ink font-medium">{n}</span><TrustBadge trust={t} /></div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-line rounded-card overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[200px_1.4fr_1fr_1fr] gap-4 px-6 py-2 bg-surface border-b border-line text-xs font-medium"><span>Level</span><span>How it&apos;s confirmed</span><span>Where it comes from</span><span>Example</span></div>
              {COMPARE.map((r) => (
                <div key={r[0]} className="grid grid-cols-[200px_1.4fr_1fr_1fr] gap-4 px-6 py-4 border-t border-line first:border-t-0 text-sm items-start">
                  <span className="text-ink font-semibold">{r[0]}</span><span>{r[1]}</span><span>{r[2]}</span><span>{r[3]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-8 py-24 flex flex-wrap gap-16 items-center">
        <div className="flex-[1_1_400px] min-w-0 md:order-2">
          <div className="text-sm font-semibold text-brand mb-2">For businesses</div>
          <h2 className="text-[28px] sm:text-[40px] leading-[1.15] tracking-[-0.02em] font-semibold mb-4 text-ink">Describe the work in plain words.</h2>
          <p className="max-w-[440px] mb-6">Launchpad turns your description into deliverables, milestones, an hour estimate, and a pay range or a volunteer option. You edit anything before you publish.</p>
          <Button href="/business/new">Post a project</Button>
        </div>
        <div className="flex-[1_1_400px] min-w-0 md:order-1 border border-line rounded-card overflow-hidden" aria-hidden>
          <div className="p-6"><div className="text-xs font-medium mb-2">Describe what you need</div><div className="border border-line rounded-control p-3 text-sm text-ink">I need a simple website with our menu, hours, and an online order form.</div></div>
          <div className="px-6 py-4 border-t border-line bg-surface text-sm flex flex-col gap-2">
            {[["Deliverables", "4"], ["Milestones", "3"], ["Estimate", "20 hours"], ["Suggested stipend", "$350 to $450"]].map(([l, v]) => (
              <div key={l} className="flex justify-between"><span>{l}</span><b className="text-ink font-semibold">{v}</b></div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-8 pb-24">
        <div className="border border-line rounded-card p-12 flex flex-wrap gap-8 items-center justify-between">
          <h2 className="text-[28px] leading-[1.2] tracking-[-0.02em] font-semibold text-ink max-w-[480px]">Start with a profile or a project.</h2>
          <div className="flex gap-4 flex-wrap"><Button href="/onboarding/student">I&apos;m a student</Button><Button href="/business/new" variant="secondary">I&apos;m a business</Button></div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-[1200px] mx-auto px-8 py-12 flex flex-wrap gap-12 justify-between text-sm">
          <div className="flex items-center gap-2 self-start"><Image src="/logo.png" alt="" width={43} height={40} className="h-10 w-auto" /><span className="text-xl font-semibold tracking-[-0.02em] text-ink">Launchpad</span></div>
          <div className="flex gap-16 flex-wrap">
            {[["Students", ["Matched projects", "Verified skills", "Public profile"]], ["Businesses", ["Post a project", "Milestone approvals", "Reviews"]], ["Company", ["About", "Privacy", "Terms"]]].map(([h, items]) => (
              <div key={h as string} className="flex flex-col gap-2"><b className="text-ink font-semibold">{h as string}</b>{(items as string[]).map((i) => <span key={i}>{i}</span>)}</div>
            ))}
          </div>
          <div className="w-full text-xs border-t border-line pt-4">© 2026 Launchpad. A hackathon demo built on simulated data.</div>
        </div>
      </footer>
    </div>
  );
}

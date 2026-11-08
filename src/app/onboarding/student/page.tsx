"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { OnboardShell } from "@/components/onboard";
import { Chip, Input, Select, toast } from "@/components/ui";
import { auth, ServiceError } from "@/services";
import { Faculty, type AvailabilityPref } from "@/schemas";

const SKILLS = ["HTML", "CSS", "JavaScript", "React", "Figma", "Python", "SQL", "Copywriting", "Social media", "Excel", "Brand design", "Research"];
const HOURS = [{ label: "1 to 5", value: 4 }, { label: "6 to 10", value: 8 }, { label: "11 to 15", value: 12 }, { label: "16 or more", value: 18 }];
const PREFS: { label: string; value: AvailabilityPref }[] = [{ label: "Paid only", value: "paid" }, { label: "Volunteer only", value: "volunteer" }, { label: "Open to both", value: "both" }];
const STEPS = ["York email", "Program", "Skills", "Hours and pay"];
const COPY = [
  ["Verify your York email", "Only York students can join. We check the domain, nothing is sent."],
  ["What are you studying?", "Used to match you with relevant projects."],
  ["Which skills do you have?", "Anything you pick here is shown as Not verified until a reviewer approves a project."],
  ["How much time, and paid or volunteer?", "Projects are scoped to fit your week. You can change this later."],
];

export default function StudentOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [program, setProgram] = useState("");
  const [faculty, setFaculty] = useState<Faculty>("Lassonde");
  const [year, setYear] = useState(2);
  const [campus, setCampus] = useState<"Keele" | "Glendon">("Keele");
  const [skills, setSkills] = useState<string[]>([]);
  const [hours, setHours] = useState(8);
  const [pref, setPref] = useState<AvailabilityPref>("both");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = async () => {
    setError(null);
    if (step === 0) {
      if (name.trim().length < 2) return setError("Enter your name.");
      setBusy(true);
      try {
        const r = await auth.validateYorkEmail(email);
        if (!r.valid) return setError(r.reason ?? "Use your York email address.");
        setVerified(true);
        setStep(1);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === 1 && program.trim().length < 2) return setError("Enter your program, for example Computer Science.");
    if (step === 2 && !skills.length) return setError("Pick at least one skill.");
    if (step < 3) return setStep(step + 1);
    setBusy(true);
    try {
      const u = await auth.signUpStudent({ name, email, program, faculty, year, campus, skills, hoursPerWeek: hours, pref });
      toast.success(`Welcome to Launchpad, ${u.displayName.split(" ")[0]}.`);
      router.push("/dashboard");
    } catch (e) {
      toast.error(e instanceof ServiceError || e instanceof Error ? e.message : "Could not create your profile.");
      setBusy(false);
    }
  };

  return (
    <OnboardShell heading="Create your student profile" steps={STEPS} step={step} title={COPY[step][0]} sub={COPY[step][1]} onNext={next} onBack={() => setStep(step - 1)} nextLabel={step === 3 ? "Finish" : step === 0 ? "Check my email" : "Continue"} loading={busy}>
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <Input label="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <Input label="York email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setVerified(false); }} placeholder="you@my.yorku.ca" error={error} hint="Use your @my.yorku.ca or @yorku.ca address." autoComplete="email" />
          {verified && <p className="text-sm text-ok flex items-center gap-2"><BadgeCheck size={16} aria-hidden /> York Verified</p>}
        </div>
      )}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Program" value={program} onChange={(e) => setProgram(e.target.value)} error={error} placeholder="Computer Science" />
          <Select label="Faculty" value={faculty} onChange={(e) => setFaculty(e.target.value as Faculty)} options={Faculty.options.map((f) => ({ value: f, label: f }))} />
          <Select label="Year" value={String(year)} onChange={(e) => setYear(Number(e.target.value))} options={[1, 2, 3, 4, 5].map((y) => ({ value: String(y), label: `Year ${y}` }))} />
          <Select label="Campus" value={campus} onChange={(e) => setCampus(e.target.value as "Keele" | "Glendon")} options={[{ value: "Keele", label: "Keele" }, { value: "Glendon", label: "Glendon" }]} />
        </div>
      )}
      {step === 2 && (
        <div>
          <div role="group" aria-label="Skills" className="flex flex-wrap gap-2">
            {SKILLS.map((s) => <Chip key={s} active={skills.includes(s)} onClick={() => setSkills((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]))}>{s}</Chip>)}
          </div>
          {error && <p role="alert" className="text-xs text-bad mt-2">{error}</p>}
        </div>
      )}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div role="group" aria-label="Hours per week" className="flex flex-wrap gap-2">
            {HOURS.map((h) => <Chip key={h.label} active={hours === h.value} onClick={() => setHours(h.value)}>{h.label} hours a week</Chip>)}
          </div>
          <div role="group" aria-label="Pay preference" className="flex flex-wrap gap-2">
            {PREFS.map((p) => <Chip key={p.value} active={pref === p.value} onClick={() => setPref(p.value)}>{p.label}</Chip>)}
          </div>
          <p className="text-sm">You can add certifications after sign-up from the Certifications page.</p>
        </div>
      )}
    </OnboardShell>
  );
}

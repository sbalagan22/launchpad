"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardShell } from "@/components/onboard";
import { Chip, Input, Select, toast } from "@/components/ui";
import { misc, students, ServiceError } from "@/services";
import { School, type AvailabilityPref } from "@/schemas";

const FIELDS = ["Computer Science", "Design", "Business", "Engineering", "Marketing", "Communications", "Data Science", "Other"];
const SKILLS = ["HTML", "CSS", "JavaScript", "Figma", "Python", "SQL", "Writing", "Canva", "Excel", "Branding", "Research"];
const HOURS = ["1 to 5", "6 to 10", "11 to 15", "16 or more"];
const HOURS_VALUE: Record<string, number> = { "1 to 5": 4, "6 to 10": 8, "11 to 15": 12, "16 or more": 18 };
const PREFS: { label: string; value: AvailabilityPref }[] = [{ label: "Paid only", value: "paid" }, { label: "Volunteer only", value: "volunteer" }, { label: "Open to both", value: "both" }];
const STEPS = ["Field of study", "Skills", "Weekly hours", "Paid or volunteer"];
const COPY = [
  ["What do you study?", "Used to match you with relevant projects."],
  ["Which skills do you have?", "Select all that apply. You can verify them later."],
  ["How many hours a week can you commit?", "Projects are scoped to fit your schedule."],
  ["Paid or volunteer projects?", "You can change this at any time."],
];

export default function StudentOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [school, setSchool] = useState<string>(School.options[0]);
  const [field, setField] = useState("Computer Science");
  const [skills, setSkills] = useState<string[]>(["HTML", "CSS"]);
  const [hours, setHours] = useState("6 to 10");
  const [pref, setPref] = useState<AvailabilityPref>("both");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = async () => {
    if (step === 0 && name.trim().length < 2) return setError("Enter your name");
    if (step === 1 && !skills.length) return toast.error("Pick at least one skill.");
    setError(null);
    if (step < 3) return setStep(step + 1);
    setBusy(true);
    try {
      const s = await students.createStudent({ name, school: school as never, field, skills, hoursPerWeek: HOURS_VALUE[hours], pref });
      await misc.signIn({ role: "student", userId: s.id });
      toast.success(`Welcome to Launchpad, ${s.name.split(" ")[0]}.`);
      router.push("/projects");
    } catch (e) {
      toast.error(e instanceof ServiceError ? e.message : "Could not create your profile.");
      setBusy(false);
    }
  };

  return (
    <OnboardShell heading="Create your student profile" steps={STEPS} step={step} title={COPY[step][0]} sub={COPY[step][1]} onNext={next} onBack={() => setStep(step - 1)} nextLabel={step === 3 ? "Finish" : "Continue"} loading={busy}>
      {step === 0 && (
        <div className="flex flex-col gap-6">
          <Input label="Your name" value={name} onChange={(e) => setName(e.target.value)} error={error} autoComplete="name" />
          <Select label="School" value={school} onChange={(e) => setSchool(e.target.value)} options={School.options.map((s) => ({ value: s, label: s }))} />
          <div role="group" aria-label="Field of study" className="flex flex-wrap gap-2">
            {FIELDS.map((f) => <Chip key={f} active={field === f} onClick={() => setField(f)}>{f}</Chip>)}
          </div>
        </div>
      )}
      {step === 1 && <div role="group" aria-label="Skills" className="flex flex-wrap gap-2">{SKILLS.map((s) => <Chip key={s} active={skills.includes(s)} onClick={() => setSkills(skills.includes(s) ? skills.filter((x) => x !== s) : [...skills, s])}>{s}</Chip>)}</div>}
      {step === 2 && <div role="group" aria-label="Hours per week" className="flex flex-wrap gap-2">{HOURS.map((h) => <Chip key={h} active={hours === h} onClick={() => setHours(h)}>{h}</Chip>)}</div>}
      {step === 3 && <div role="group" aria-label="Pay preference" className="flex flex-wrap gap-2">{PREFS.map((p) => <Chip key={p.value} active={pref === p.value} onClick={() => setPref(p.value)}>{p.label}</Chip>)}</div>}
      {step === 1 && <p className="text-xs mt-4">Skills you add here are labeled self-reported until you verify them.</p>}
    </OnboardShell>
  );
}

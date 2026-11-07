"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardShell } from "@/components/onboard";
import { Chip, Input, Textarea, toast } from "@/components/ui";
import { misc, students, ServiceError } from "@/services";

const STEPS = ["Type of organization", "Name and category", "Location and story"];
const COPY = [
  ["What kind of organization are you?", "Nonprofits can post volunteer projects. Businesses offer a stipend."],
  ["What is it called?", "Students see this on every project you post."],
  ["Where are you, and what do you do?", "A sentence or two is plenty."],
];
const CITIES = ["Brampton", "Mississauga", "Toronto"] as const;

export default function BusinessOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<"business" | "nonprofit">("business");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState<(typeof CITIES)[number]>("Brampton");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const next = async () => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (name.trim().length < 2) e.name = "Enter the business name";
      if (category.trim().length < 2) e.category = "Enter a category, such as Bakery";
    }
    if (step === 2 && description.trim().length < 10) e.description = "Add a short description";
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < 2) return setStep(step + 1);
    setBusy(true);
    try {
      const b = await students.createBusiness({ name, kind, city, category, description });
      await misc.signIn({ role: "business", userId: b.id });
      toast.success(`${b.name} is set up.`);
      router.push("/business/new");
    } catch (err) {
      toast.error(err instanceof ServiceError ? err.message : "Could not create your organization.");
      setBusy(false);
    }
  };

  return (
    <OnboardShell heading="Set up your organization" steps={STEPS} step={step} title={COPY[step][0]} sub={COPY[step][1]} onNext={next} onBack={() => setStep(step - 1)} nextLabel={step === 2 ? "Finish" : "Continue"} loading={busy}>
      {step === 0 && <div role="group" aria-label="Organization type" className="flex gap-2 flex-wrap"><Chip active={kind === "business"} onClick={() => setKind("business")}>Small business</Chip><Chip active={kind === "nonprofit"} onClick={() => setKind("nonprofit")}>Nonprofit or charity</Chip></div>}
      {step === 1 && <div className="flex flex-col gap-4"><Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} /><Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} error={errors.category} placeholder="Bakery, dental clinic, food bank" /></div>}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div role="group" aria-label="City" className="flex gap-2 flex-wrap">{CITIES.map((c) => <Chip key={c} active={city === c} onClick={() => setCity(c)}>{c}</Chip>)}</div>
          <Textarea label="About" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} />
        </div>
      )}
    </OnboardShell>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, ClipboardCheck, GraduationCap, Rocket } from "lucide-react";
import { Logo } from "@/components/nav";
import { Button, Card, toast } from "@/components/ui";
import { Stagger } from "@/components/motion";
import { HOME } from "@/components/use-me";
import { auth, type DemoRole } from "@/services";

const ROLES: { role: DemoRole; icon: typeof Rocket; title: string; who: string; body: string }[] = [
  { role: "student", icon: GraduationCap, title: "Student", who: "Aisha Khan, Lassonde", body: "Browse matched projects, apply, submit milestones and add certifications." },
  { role: "poster", icon: Briefcase, title: "Poster", who: "Corner Press Coffee", body: "Describe a need, publish a scoped brief and accept applicants." },
  { role: "reviewer", icon: ClipboardCheck, title: "Reviewer", who: "Noor, York reviewer", body: "Score submissions against the rubric and approve or request changes." },
  { role: "founder", icon: Rocket, title: "Founder", who: "Reroute, YSpace venture", body: "Run a hiring pipeline and invite strong students to continue." },
];

// MOCK: there is no authentication. Each card signs in as a seeded demo user for that role.
export default function Login() {
  const router = useRouter();
  const [busy, setBusy] = useState<DemoRole | null>(null);

  const go = async (role: DemoRole) => {
    setBusy(role);
    try {
      await auth.loginDemo(role);
      router.push(HOME[role]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign in");
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[960px] mx-auto px-6 py-10">
        <Logo />
        <h1 className="h1 mt-12 mb-3">Choose a demo role</h1>
        <p className="mb-8 max-w-xl">There are no passwords in this demo. Pick a role to explore the product as that person. Real students sign up with a York email on the <Link href="/onboarding/student">student sign-up</Link>.</p>
        <Stagger className="grid sm:grid-cols-2 gap-4">
          {ROLES.map((r) => (
            <Card key={r.role} className="p-6 flex flex-col gap-3 h-full">
              <r.icon size={22} className="text-brand" aria-hidden />
              <div>
                <h2 className="text-lg font-semibold text-ink">{r.title}</h2>
                <p className="text-xs">{r.who}</p>
              </div>
              <p className="text-sm flex-1">{r.body}</p>
              <Button onClick={() => go(r.role)} loading={busy === r.role} disabled={busy !== null} data-testid={`role-${r.role}`}>
                Continue as {r.title.toLowerCase()}
              </Button>
            </Card>
          ))}
        </Stagger>
      </div>
    </div>
  );
}

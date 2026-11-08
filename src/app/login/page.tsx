"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, GraduationCap, LineChart } from "lucide-react";
import { Logo } from "@/components/nav";
import { Button, Card, toast } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { auth, type DemoRole } from "@/services";

const ACCOUNTS: { role: DemoRole; icon: typeof Rocket; name: string; who: string; body: string; home: string }[] = [
  { role: "aisha", icon: GraduationCap, name: "Aisha Khan", who: "Student, Computer Science, Lassonde", body: "Second year. Shipping a real app for a startup and applying to her next project.", home: "/dashboard" },
  { role: "priya", icon: LineChart, name: "Priya Nair", who: "Student, Business, Schulich", body: "Third year marketing student doing customer research for an early-stage team.", home: "/dashboard" },
  { role: "omar", icon: Rocket, name: "Omar Haddad", who: "Founder, Reroute", body: "Runs a YSpace-style startup, posts projects, approves milestones and invites students to continue.", home: "/founder" },
];

// MOCK: there is no authentication. Each card signs in as one of the three seeded demo accounts.
export default function Login() {
  const router = useRouter();
  const [busy, setBusy] = useState<DemoRole | null>(null);

  const go = async (a: (typeof ACCOUNTS)[number]) => {
    setBusy(a.role);
    try {
      await auth.loginDemo(a.role);
      router.push(a.home);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign in");
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[960px] mx-auto px-6 py-10">
        <Logo />
        <h1 className="h1 mt-12 mb-3">Choose a demo account</h1>
        <p className="mb-8 max-w-xl">There are no passwords in this demo. Pick an account to explore the product as that person.</p>
        <Stagger className="grid md:grid-cols-3 gap-4">
          {ACCOUNTS.map((a) => (
            <StaggerItem key={a.role} className="h-full">
              <Card lift className="p-6 flex flex-col gap-3 h-full">
                <a.icon size={22} className="text-brand" aria-hidden />
                <div>
                  <h2 className="text-lg font-semibold text-ink">{a.name}</h2>
                  <p className="text-xs">{a.who}</p>
                </div>
                <p className="text-sm flex-1">{a.body}</p>
                <Button onClick={() => go(a)} loading={busy === a.role} disabled={busy !== null} data-testid={`role-${a.role}`}>
                  Continue as {a.name.split(" ")[0]}
                </Button>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  );
}

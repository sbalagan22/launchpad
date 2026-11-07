"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/nav";
import { Button, Card, Input, Segmented, toast } from "@/components/ui";
import { misc, ServiceError } from "@/services";
import { DEMO_BUSINESS_ID, DEMO_STUDENT_ID } from "@/store";

// MOCK: there is no authentication. Any submit signs in as the seeded user for the chosen role.
export default function Login() {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "business">("student");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async (r: "student" | "business") => {
    setBusy(true);
    setError(null);
    try {
      await misc.signIn({ role: r, userId: r === "student" ? DEMO_STUDENT_ID : DEMO_BUSINESS_ID });
      toast.success(r === "student" ? "Signed in as Aisha Khan." : "Signed in as Sunrise Bakery.");
      router.push(r === "student" ? "/projects" : "/business");
    } catch (e) {
      setError(e instanceof ServiceError ? e.message : "Could not sign in.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface grid place-items-center px-6 py-12">
      <div className="w-full max-w-[420px] flex flex-col gap-6">
        <div className="flex justify-center"><Logo /></div>
        <Card className="p-8">
          <h1 className="h2 mb-1">Log in</h1>
          <p className="text-sm mb-6">Demo mode: no password is checked.</p>
          <form onSubmit={(e) => { e.preventDefault(); void go(role); }} className="flex flex-col gap-4">
            <Segmented label="Account type" value={role} onChange={setRole} options={[{ value: "student", label: "Student" }, { value: "business", label: "Business or nonprofit" }]} />
            <Input label="Email" type="email" key={`e-${role}`} defaultValue={role === "student" ? "aisha.khan@yorku.ca" : "hello@sunrisebakery.ca"} autoComplete="email" />
            <Input label="Password" type="password" defaultValue="launchpad-demo" autoComplete="current-password" />
            {error && <p role="alert" className="text-sm text-bad">{error}</p>}
            <Button type="submit" loading={busy} full>Log in</Button>
          </form>
        </Card>
        <p className="text-sm text-center">New here? <Link href="/onboarding/student" className="font-semibold">Create a student profile</Link> or <Link href="/onboarding/business" className="font-semibold">register a business</Link>.</p>
      </div>
    </div>
  );
}

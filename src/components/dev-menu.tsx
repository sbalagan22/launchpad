"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Button, Select, toast } from "@/components/ui";
import { admin, auth } from "@/services";
import { useQuery, useSession } from "@/hooks/use-query";
import { HOME, kindOf } from "@/components/use-me";

/** Hidden developer menu. Open with Ctrl+Shift+D (Cmd+Shift+D on macOS). */
export function DevMenu() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState("");
  const router = useRouter();
  const { hydrated } = useSession();
  const { data: users } = useQuery(open && hydrated ? "dev:users" : null, () => auth.listDemoUsers());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const options = users
    ? [
        ...users.students.map((u) => ({ value: `student:${u.id}`, label: `Student: ${u.name}` })),
        ...users.businesses.map((u) => ({ value: `business:${u.id}`, label: `Business: ${u.name}` })),
      ]
    : [];

  const switchUser = async () => {
    const [role, id] = target.split(":");
    if (!id) return;
    setBusy(true);
    try {
      const u = await auth.switchTo(role as "student" | "business", id);
      toast.success(`Now signed in as ${u.displayName}`);
      setOpen(false);
      const r = kindOf(u);
      router.push(r ? HOME[r] : "/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not switch user");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await admin.resetDemoData();
      toast.success("Demo data restored to the seed");
      setOpen(false);
      router.push("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Developer menu">
      <h2 className="h3 mb-4">Developer menu</h2>
      <div className="flex flex-col gap-4">
        <Select label="Switch to" value={target} onChange={(e) => setTarget(e.target.value)} options={[{ value: "", label: "Choose a user" }, ...options]} />
        <div className="flex gap-2">
          <Button onClick={switchUser} disabled={!target} loading={busy}>Switch user</Button>
          <Button variant="secondary" onClick={reset} loading={busy}>Reset demo data</Button>
        </div>
        <p className="text-xs">Reset restores the seeded state with fresh relative dates. Data lives in this browser only.</p>
      </div>
    </Modal>
  );
}

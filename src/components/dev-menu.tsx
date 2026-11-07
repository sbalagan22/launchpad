"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Button, Segmented, Select, toast } from "@/components/ui";
import { misc } from "@/services";
import { useQuery, useSession } from "@/hooks/use-query";

/** Hidden developer menu. Open with Ctrl+Shift+D (Cmd+Shift+D on macOS). */
export function DevMenu() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<"student" | "business">("student");
  const [target, setTarget] = useState("");
  const router = useRouter();
  const { hydrated } = useSession();
  const { data: users } = useQuery(open && hydrated ? "dev:users" : null, () => misc.listDemoUsers());

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

  const list = role === "student" ? users?.students : users?.businesses;
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Developer menu">
      <h2 className="h2 mb-1">Developer menu</h2>
      <p className="text-sm mb-6">Demo tools. Nothing here exists in the product UI.</p>
      <div className="flex flex-col gap-6">
        <section aria-label="Reset">
          <h3 className="text-sm font-semibold text-ink mb-1">Reset demo data</h3>
          <p className="text-sm mb-3">Restores the seed dataset with freshly computed dates and signs out.</p>
          <Button
            variant="danger"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await misc.resetDemoData();
              setBusy(false);
              setOpen(false);
              toast.success("Demo data restored to the seed.");
              router.push("/");
            }}
          >
            Reset demo data
          </Button>
        </section>
        <section aria-label="Switch user" className="border-t border-line pt-6">
          <h3 className="text-sm font-semibold text-ink mb-3">Switch to any seeded user</h3>
          <div className="flex flex-col gap-3">
            <Segmented label="Role" value={role} onChange={(r) => { setRole(r); setTarget(""); }} options={[{ value: "student", label: "Students" }, { value: "business", label: "Businesses" }]} />
            <Select label="User" value={target} onChange={(e) => setTarget(e.target.value)} options={[{ value: "", label: "Choose a user" }, ...(list ?? []).map((u) => ({ value: u.id, label: `${u.name} (${u.sub})` }))]} />
            <div>
              <Button
                variant="secondary"
                disabled={!target}
                onClick={() => {
                  misc.switchToUser(role, target);
                  setOpen(false);
                  router.push(role === "student" ? "/projects" : "/business");
                }}
              >
                Switch user
              </Button>
            </div>
          </div>
        </section>
        <section aria-label="AI mode" className="border-t border-line pt-6 text-sm">
          <h3 className="text-sm font-semibold text-ink mb-1">AI mode</h3>
          AI features use pre-written responses unless the server runs with <code>USE_REAL_AI=true</code> and an <code>ANTHROPIC_API_KEY</code>. Any error falls back to the pre-written response.
        </section>
      </div>
    </Modal>
  );
}

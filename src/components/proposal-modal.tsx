"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { AiNote, Button, Modal, Textarea, toast } from "@/components/ui";
import { ai, applications, misc, ServiceError } from "@/services";
import { streamText } from "@/lib/stream";
import type { AiSource } from "@/services/ai";

/** Apply flow: AI-drafted proposal (streamed), editable, then sent. */
export function ProposalModal({ open, onClose, projectId, studentId, businessId, businessName }: { open: boolean; onClose: () => void; projectId: string; studentId: string; businessId: string; businessName: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [source, setSource] = useState<AiSource>("mock");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    const ctl = new AbortController();
    abort.current = ctl;
    // reset before drafting; the async work below sets state from callbacks
    queueMicrotask(() => { setSent(false); setError(null); setText(""); setDrafting(true); });
    ai.draftProposal({ projectId, studentId })
      .then(async (r) => {
        setSource(r.source);
        await streamText(r.text, setText, { signal: ctl.signal });
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not draft a proposal."))
      .finally(() => !ctl.signal.aborted && setDrafting(false));
    return () => ctl.abort();
  }, [open, projectId, studentId]);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      await applications.apply({ projectId, studentId, proposal: text });
      setSent(true);
      toast.success("Proposal sent.");
    } catch (e) {
      setError(e instanceof ServiceError ? e.message : "Could not send your proposal.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={sent ? "Proposal sent" : `Proposal for ${businessName}`} labelledBy="proposal-title">
      {!sent ? (
        <div>
          <div className="text-xs font-medium text-brand mb-2 flex items-center gap-1"><Sparkles size={14} aria-hidden />AI-drafted from your profile</div>
          <h2 id="proposal-title" className="h2 mb-2">Proposal for {businessName}</h2>
          <p className="text-sm mb-6">Edit anything before you send it.</p>
          <Textarea label="Proposal" hideLabel rows={11} value={text} onChange={(e) => setText(e.target.value)} disabled={drafting} aria-busy={drafting} error={error} className="h-64 text-base" />
          <AiNote source={source} className="mt-2" />
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={send} loading={sending} disabled={drafting || text.trim().length < 30}>Send proposal</Button>
          </div>
        </div>
      ) : (
        <div>
          <h2 id="proposal-title" className="h2 mb-2">Proposal sent</h2>
          <p className="mb-2">{businessName} usually replies within 48 hours.</p>
          <p className="text-sm mb-6">Demo tip: continue as {businessName} to accept your proposal, then come back to your workspace.</p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => { misc.switchToUser("business", businessId); router.push(`/business/projects/${projectId}`); }}>Continue as {businessName}</Button>
            <Button variant="secondary" href="/projects">Back to projects</Button>
            <Link href="/workspace" className="text-sm font-semibold self-center">My applications</Link>
          </div>
        </div>
      )}
    </Modal>
  );
}

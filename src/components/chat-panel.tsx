"use client";

import { useEffect, useRef, useState } from "react";
import type { Thread } from "@/schemas";
import { Button, Card, EmptyState, toast } from "@/components/ui";
import { workspace, ServiceError } from "@/services";
import { relTime } from "@/lib/dates";

export function ChatPanel({ projectId, thread, me, myName, otherName }: { projectId: string; thread: Thread | null; me: "student" | "business"; myName: string; otherName: string }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const count = thread?.messages.length ?? 0;

  useEffect(() => {
    const box = end.current?.parentElement;
    if (box) box.scrollTop = box.scrollHeight;
  }, [count]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await workspace.sendMessage({ projectId, from: me, text });
      setText("");
    } catch (e) {
      toast.error(e instanceof ServiceError ? e.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card as="section" aria-label={`Messages with ${otherName}`}>
      <div className="px-6 py-4 border-b border-line text-sm font-semibold text-ink bg-surface rounded-t-card">Messages with {otherName}</div>
      <div className="p-6 flex flex-col gap-4 max-h-80 overflow-auto" role="log" aria-live="polite">
        {count === 0 ? (
          <EmptyState title="No messages yet" body="Say hello and confirm the first milestone." />
        ) : (
          thread!.messages.map((m) => {
            const mine = m.from === me;
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div className="text-xs mb-1">{mine ? "You" : otherName} · {relTime(m.at)}</div>
                <div className={`max-w-[80%] px-4 py-2 rounded-card text-sm leading-relaxed border ${mine ? "bg-brand text-white border-brand" : "bg-white text-ink border-line"}`}>{m.text}</div>
              </div>
            );
          })
        )}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="px-6 py-4 border-t border-line flex gap-2">
        <input aria-label={`Message as ${myName}`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" className="flex-1 min-w-0 h-10 border border-line rounded-control px-3 text-sm outline-none focus:border-brand" />
        <Button type="submit" loading={sending} disabled={!text.trim()}>Send</Button>
      </form>
    </Card>
  );
}

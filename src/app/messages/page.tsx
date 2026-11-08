"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Paperclip, Send } from "lucide-react";
import { PageContainer } from "@/components/nav";
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, Skeleton, Textarea, toast, cx } from "@/components/ui";
import { useQuery, useSession } from "@/hooks/use-query";
import { messages, type ThreadDetail, type ThreadSummary } from "@/services";
import { relTime } from "@/lib/dates";

function Inbox() {
  const router = useRouter();
  const sp = useSearchParams();
  const sel = sp.get("t");
  const { userId, hydrated } = useSession();
  const list = useQuery(hydrated ? `msg:list:${userId}` : null, () => messages.threads());
  const detail = useQuery(sel ? `msg:thread:${sel}` : null, () => messages.thread(sel!));

  if (list.error) return <PageContainer><ErrorState error={list.error} onRetry={list.refetch} /></PageContainer>;
  const items = list.data;
  const selected = sel && items?.some((i) => i.thread.id === sel) ? sel : null;
  return (
    <PageContainer>
      <h1 className="h2 mb-6">Messages</h1>
      {!items ? <Skeleton className="h-96" /> : items.length === 0 ? <EmptyState title="No conversations yet" body="Messages with posters and students appear here once a project starts." /> : (
        <Card className="grid md:grid-cols-[340px_1fr] overflow-hidden min-h-[560px]">
          <div className={cx("border-r border-line flex-col", selected ? "hidden md:flex" : "flex")} aria-label="Conversations">
            <ul className="list-none p-0 m-0 overflow-y-auto max-h-[640px]">
              {items.map((i) => <li key={i.thread.id}><Row s={i} active={i.thread.id === selected} onOpen={() => router.push(`/messages?t=${i.thread.id}`)} /></li>)}
            </ul>
          </div>
          <div className={cx("flex-col min-w-0", selected ? "flex" : "hidden md:flex")}>
            {selected && detail.data ? <Conversation d={detail.data} onBack={() => router.push("/messages")} /> : selected ? <div className="p-6"><Skeleton className="h-64" /></div> : <div className="m-auto p-6 text-sm">Choose a conversation.</div>}
          </div>
        </Card>
      )}
    </PageContainer>
  );
}

function Row({ s, active, onOpen }: { s: ThreadSummary; active: boolean; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} aria-current={active ? "true" : undefined} className={cx("w-full text-left flex gap-3 px-4 py-3 border-b border-line cursor-pointer items-start", active ? "bg-tint" : "bg-white hover:bg-surface")} data-testid="thread-row">
      <Avatar name={s.other.name} size={40} />
      <span className="flex-1 min-w-0">
        <span className="flex justify-between gap-2"><b className={cx("text-sm truncate", s.unread ? "text-ink font-bold" : "text-ink font-semibold")}>{s.other.name}</b><span className="text-xs flex-none">{relTime(s.last.at)}</span></span>
        <span className="block text-xs truncate">{s.project?.title ?? s.other.sub}</span>
        <span className="flex items-center gap-2"><span className={cx("block text-sm truncate flex-1", s.unread > 0 && "text-ink font-medium")}>{s.last.text}</span>{s.unread > 0 && <span aria-label={`${s.unread} unread`} className="w-2.5 h-2.5 rounded-full bg-brand flex-none" />}</span>
      </span>
    </button>
  );
}

function Conversation({ d, onBack }: { d: ThreadDetail; onBack: () => void }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const me = d.other.kind === "business" ? "student" : "business";
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [d.thread.messages.length]);
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try { await messages.send(d.thread.id, text, file ? [file] : []); setText(""); setFile(null); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not send"); } finally { setBusy(false); }
  };
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
        <button type="button" onClick={onBack} aria-label="Back to conversations" className="md:hidden cursor-pointer w-10 h-10 grid place-items-center rounded-control border border-line bg-white"><ArrowLeft size={16} aria-hidden /></button>
        <Avatar name={d.other.name} size={36} />
        <div className="min-w-0"><b className="text-ink font-semibold block truncate">{d.other.name}</b><span className="text-xs">{d.other.sub}</span></div>
      </div>
      {d.project && (
        <div className="px-4 py-2 bg-surface border-b border-line text-xs flex flex-wrap items-center justify-between gap-2" data-testid="context-card">
          <span>About <b className="text-ink font-semibold">{d.project.title}</b></span>
          <Badge tone={d.project.status === "completed" ? "ok" : "brand"}>{d.project.status === "completed" ? "Completed" : d.project.status === "in_progress" ? "In progress" : "Open"}</Badge>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 max-h-[480px]" role="log" aria-label="Messages">
        {d.thread.messages.map((m) => (
          <div key={m.id} className={cx("max-w-[80%] flex flex-col gap-1", m.from === me ? "self-end items-end" : "self-start")}>
            <div className={cx("rounded-2xl px-4 py-2 text-sm", m.from === me ? "bg-brand text-white" : "bg-surface text-ink")}>{m.text}</div>
            {m.attachments.map((a) => <span key={a} className="inline-flex items-center gap-1 text-xs border border-line rounded-lg px-2 py-1 bg-white"><Paperclip size={12} aria-hidden />{a}</span>)}
            <span className="text-[11px] text-muted">{relTime(m.at)}</span>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="border-t border-line p-3 flex flex-col gap-2">
        <Textarea label="Write a message" hideLabel rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} />
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => setFile(file ? null : "attachment.pdf")} aria-pressed={Boolean(file)}><Paperclip size={14} aria-hidden />{file ? "Attached: attachment.pdf" : "Attach file"}</Button>
          <Button onClick={send} loading={busy} disabled={!text.trim()} data-testid="send-msg"><Send size={14} aria-hidden />Send</Button>
        </div>
      </div>
    </>
  );
}

export default function MessagesPage() {
  return <Suspense fallback={<PageContainer><Skeleton className="h-96" /></PageContainer>}><Inbox /></Suspense>;
}

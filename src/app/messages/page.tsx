"use client";

import { useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/nav";
import { ChatPanel } from "@/components/chat-panel";
import { Card, EmptyState, ErrorState, Skeleton, cx } from "@/components/ui";
import { useQuery, useSession } from "@/hooks/use-query";
import { misc } from "@/services";
import { relTime } from "@/lib/dates";

export default function Messages() {
  const { role, userId, hydrated } = useSession();
  const { data, error, loading, refetch } = useQuery(hydrated ? `threads:${role}:${userId}` : null, () => misc.listThreads(role, userId));
  const [picked, setPicked] = useState<string | null>(null);
  if (error) return <PageContainer><ErrorState error={error} onRetry={refetch} /></PageContainer>;
  const sel = data?.find((t) => t.thread.id === picked) ?? data?.[0];
  return (
    <PageContainer>
      <h1 className="h2 mb-1">Messages</h1>
      <p className="text-sm mb-8">One thread per project. Messages are saved on this device for the demo.</p>
      {loading ? <Skeleton className="h-64 w-full" /> : !data?.length ? (
        <EmptyState title="No conversations yet" body={role === "student" ? "A chat opens when a business accepts your proposal." : "A chat opens when you accept an applicant."} action={<Link href={role === "student" ? "/projects" : "/business"} className="text-sm font-semibold">{role === "student" ? "Browse projects" : "Go to dashboard"}</Link>} />
      ) : (
        <div className="flex flex-wrap gap-8 items-start">
          <Card className="flex-[1_1_280px] min-w-0 overflow-hidden" aria-label="Conversations">
            {data.map(({ thread, project, business, student }) => {
              const last = thread.messages[thread.messages.length - 1];
              const other = role === "student" ? business.name : student.name;
              return (
                <button key={thread.id} type="button" aria-pressed={sel?.thread.id === thread.id} onClick={() => setPicked(thread.id)} className={cx("w-full text-left px-4 py-3 border-t border-line first:border-t-0 cursor-pointer hover:bg-surface", sel?.thread.id === thread.id && "bg-surface")}>
                  <div className="flex justify-between gap-2 text-sm"><b className="text-ink font-semibold">{other}</b><span className="text-xs">{relTime(last.at)}</span></div>
                  <div className="text-xs text-ink">{project.title}</div>
                  <div className="text-xs truncate">{last.text}</div>
                </button>
              );
            })}
          </Card>
          <div className="flex-[2_1_480px] min-w-0">
            {sel && (
              <>
                <div className="text-sm mb-2"><Link href={role === "student" ? `/workspace/${sel.project.id}` : `/business/projects/${sel.project.id}`} className="font-semibold">{sel.project.title}</Link></div>
                <ChatPanel projectId={sel.project.id} thread={sel.thread} me={role} myName={role === "student" ? sel.student.name : sel.business.name} otherName={role === "student" ? sel.business.name : sel.student.name} />
              </>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

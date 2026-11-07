"use client";

import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/nav";
import { Button, Card, EmptyState, ErrorState, Skeleton, toast } from "@/components/ui";
import { useQuery, useSession } from "@/hooks/use-query";
import { misc } from "@/services";
import { relTime } from "@/lib/dates";

export default function Notifications() {
  const { userId, hydrated } = useSession();
  const router = useRouter();
  const { data, error, loading, refetch } = useQuery(hydrated ? `notifs:${userId}` : null, () => misc.listNotifications(userId));
  if (error) return <PageContainer><ErrorState error={error} onRetry={refetch} /></PageContainer>;
  const unread = data?.filter((n) => !n.read).length ?? 0;
  return (
    <PageContainer>
      <div className="flex justify-between items-end flex-wrap gap-4 mb-8">
        <div><h1 className="h2 mb-1">Notifications</h1><p className="text-sm">{unread ? `${unread} unread` : "You are all caught up."}</p></div>
        <Button variant="secondary" disabled={!unread} onClick={async () => { await misc.markAllRead(userId); toast.success("All marked as read."); }}>Mark all as read</Button>
      </div>
      {loading ? <Skeleton className="h-48 w-full" /> : !data?.length ? <EmptyState title="No notifications yet" body="Updates about applications, milestones and reviews appear here." /> : (
        <Card as="div"><ul className="list-none p-0 m-0">
          {data.map((n) => (
            <li key={n.id} className="border-t border-line first:border-t-0">
              <button type="button" onClick={async () => { if (!n.read) await misc.markRead(n.id); router.push(n.href); }} className="w-full text-left px-6 py-4 flex gap-4 items-start hover:bg-surface cursor-pointer">
                <span aria-hidden className={`mt-2 w-2 h-2 rounded-full flex-none ${n.read ? "bg-transparent" : "bg-brand"}`} />
                <span className="flex-1 min-w-0"><span className="flex justify-between gap-4 text-sm"><b className="font-semibold text-ink">{n.title}{!n.read && <span className="sr-only"> (unread)</span>}</b><span className="text-xs whitespace-nowrap">{relTime(n.createdAt)}</span></span><span className="block text-sm">{n.body}</span></span>
              </button>
            </li>
          ))}
        </ul></Card>
      )}
    </PageContainer>
  );
}

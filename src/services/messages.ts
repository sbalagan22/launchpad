import { z } from "zod";
import { Message, type Db, type Thread } from "@/schemas";
import { ThreadDetail, ThreadSummary } from "@/schemas/views";
import { newId } from "@/lib/ids";
import { CONTACT } from "@/mocks/people";
import type { MessagesApi } from "./contract";
import { ServiceError, parseInput, read, write } from "./core";
import { me } from "./helpers";

const side = () => (me().role === "student" ? "student" : "business");

function summary(db: Db, t: Thread) {
  const s = side();
  const student = db.students.find((x) => x.id === t.studentId)!;
  const business = db.businesses.find((x) => x.id === t.businessId)!;
  return {
    thread: t, project: db.projects.find((p) => p.id === t.projectId) ?? null,
    other: s === "student" ? { id: business.id, name: CONTACT[business.id] ?? business.name, sub: business.name, kind: "business" as const } : { id: student.id, name: student.name, sub: `${student.program}, ${student.faculty}`, kind: "student" as const },
    last: t.messages[t.messages.length - 1], unread: t.unread[s],
  };
}
const detail = (db: Db, t: Thread) => ({ ...summary(db, t), business: db.businesses.find((x) => x.id === t.businessId)!, student: db.students.find((x) => x.id === t.studentId)! });
const mine = (db: Db) => db.threads.filter((t) => (me().role === "student" ? t.studentId === me().userId : t.businessId === me().userId));

export const messages: MessagesApi = {
  async threads() {
    return read(z.array(ThreadSummary), (db) => mine(db).map((t) => summary(db, t)).sort((a, b) => b.last.at.localeCompare(a.last.at)));
  },
  async thread(id) {
    return write(ThreadDetail, (db) => {
      const t = mine(db).find((x) => x.id === id);
      if (!t) throw new ServiceError("not_found", "That conversation does not exist.");
      const next = { ...t, unread: { ...t.unread, [side()]: 0 } };
      return { db: { ...db, threads: db.threads.map((x) => (x.id === id ? next : x)) }, result: detail(db, next) };
    });
  },
  async send(threadId, text, attachments = []) {
    const t = parseInput(z.string().trim().min(1, "Write a message first.").max(2000), text);
    return write(ThreadDetail, (db) => {
      const th = mine(db).find((x) => x.id === threadId);
      if (!th) throw new ServiceError("not_found", "That conversation does not exist.");
      const from = side();
      const msg = Message.parse({ id: newId("msg"), from, text: t, at: new Date().toISOString(), attachments });
      const other = from === "student" ? "business" : "student";
      const next: Thread = { ...th, messages: [...th.messages, msg], unread: { ...th.unread, [other]: th.unread[other] + 1 } };
      const toId = from === "student" ? th.businessId : th.studentId;
      return {
        db: { ...db, threads: db.threads.map((x) => (x.id === threadId ? next : x)), notifications: [{ id: newId("ntf"), userId: toId, title: "New message", body: t.slice(0, 80), href: "/messages", read: false, createdAt: msg.at }, ...db.notifications] },
        result: detail(db, next),
      };
    });
  },
  async start(otherId, projectId) {
    return write(ThreadDetail, (db) => {
      const s = me();
      const studentId = s.role === "student" ? s.userId : otherId;
      const businessId = s.role === "business" ? s.userId : otherId;
      if (!db.students.some((x) => x.id === studentId) || !db.businesses.some((x) => x.id === businessId)) throw new ServiceError("not_found", "That person was not found.");
      const existing = db.threads.find((x) => x.studentId === studentId && x.businessId === businessId && x.projectId === projectId);
      if (existing) return { db, result: detail(db, existing) };
      const th: Thread = { id: newId("thr"), studentId, businessId, ...(projectId ? { projectId } : {}), unread: { student: 0, business: 0 }, messages: [{ id: newId("msg"), from: s.role === "student" ? "student" : "business", text: "Hi, I'd like to talk about this.", at: new Date().toISOString(), attachments: [] }] };
      return { db: { ...db, threads: [...db.threads, th] }, result: detail(db, th) };
    });
  },
  async unreadCount() {
    return read(z.number(), (db) => mine(db).reduce((a, t) => a + t.unread[side()], 0));
  },
};

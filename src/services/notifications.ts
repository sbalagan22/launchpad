import { z } from "zod";
import { Notification } from "@/schemas";
import type { NotificationsApi } from "./contract";
import { read, write } from "./core";
import { me } from "./helpers";

export const notifications: NotificationsApi = {
  async list() {
    return read(z.array(Notification), (db) => db.notifications.filter((n) => n.userId === me().userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async markRead(id) {
    await write(z.literal(true), (db) => ({ db: { ...db, notifications: db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }, result: true as const }));
  },
  async markAllRead() {
    await write(z.literal(true), (db) => ({ db: { ...db, notifications: db.notifications.map((n) => (n.userId === me().userId ? { ...n, read: true } : n)) }, result: true as const }));
  },
};

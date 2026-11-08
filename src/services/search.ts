import { PaletteResult } from "@/schemas/views";
import { me } from "./helpers";
import type { SearchApi } from "./contract";
import { read } from "./core";

const PAGES: Record<"student" | "business" | "reviewer", { label: string; href: string }[]> = {
  student: [{ label: "Projects", href: "/projects" }, { label: "Startups", href: "/startups" }, { label: "Workspace", href: "/workspace" }, { label: "Certifications", href: "/certifications" }, { label: "Messages", href: "/messages" }, { label: "Profile", href: "/profile" }, { label: "Impact", href: "/impact" }, { label: "Notifications", href: "/notifications" }],
  business: [{ label: "Dashboard", href: "/business" }, { label: "New project", href: "/business/new" }, { label: "Startups", href: "/startups" }, { label: "Messages", href: "/messages" }, { label: "Impact", href: "/impact" }, { label: "Notifications", href: "/notifications" }],
  reviewer: [{ label: "Review queue", href: "/reviewer" }, { label: "Startups", href: "/startups" }, { label: "Impact", href: "/impact" }, { label: "Notifications", href: "/notifications" }],
};

export const search: SearchApi = {
  async palette(query) {
    return read(PaletteResult, (db) => {
      const q = query.trim().toLowerCase();
      const has = (...parts: string[]) => !q || parts.join(" ").toLowerCase().includes(q);
      return {
        pages: PAGES[me().role].filter((p) => has(p.label)),
        projects: db.projects.filter((p) => p.status === "open").filter((p) => has(p.title, p.hook, p.skills.join(" "), p.tools.join(" "), db.businesses.find((b) => b.id === p.businessId)!.name)).slice(0, 6)
          .map((p) => ({ id: p.id, title: p.title, business: db.businesses.find((b) => b.id === p.businessId)!.name, href: `/projects/${p.id}` })),
        certs: db.catalog.filter((c) => has(c.name, c.issuer, c.category)).slice(0, 6).map((c) => ({ id: c.id, name: c.name, issuer: c.issuer, href: `/certifications?cert=${c.id}` })),
      };
    });
  },
};

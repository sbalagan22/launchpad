import { z } from "zod";
import { Business, Venture } from "@/schemas";
import { ProjectCard, VenturePage } from "@/schemas/views";
import type { StartupsApi } from "./contract";
import { ServiceError, read } from "./core";
import { card, currentStudent } from "./helpers";

export const startups: StartupsApi = {
  async listVentures(filters = {}) {
    return read(z.array(Venture.extend({ business: Business, openProjectCount: z.number().int() })), (db) => {
      const needle = (filters.q ?? "").trim().toLowerCase();
      return db.ventures
        .filter((v) => !filters.sector?.length || filters.sector.includes(v.sector))
        .filter((v) => !filters.stage?.length || filters.stage.includes(v.stage))
        .filter((v) => !filters.stack?.length || filters.stack.some((s) => v.stack.some((x) => x.toLowerCase() === s.toLowerCase())))
        .filter((v) => !needle || [v.name, v.pitch, v.stack.join(" "), v.sector].join(" ").toLowerCase().includes(needle))
        .map((v) => ({ ...v, business: db.businesses.find((b) => b.id === v.businessId)!, openProjectCount: db.projects.filter((p) => p.ventureId === v.id && p.status === "open").length }));
    });
  },

  async getVenture(id) {
    return read(VenturePage, (db) => {
      const venture = db.ventures.find((v) => v.id === id);
      if (!venture) throw new ServiceError("not_found", "That startup was not found.");
      const student = currentStudent(db);
      return {
        venture,
        business: db.businesses.find((b) => b.id === venture.businessId)!,
        openProjects: db.projects.filter((p) => p.ventureId === id && p.status === "open").map((p) => card(db, p, student)),
        past: db.projects.filter((p) => p.ventureId === id && p.status === "completed" && p.studentId).map((p) => ({ project: p, review: db.reviews.find((r) => r.projectId === p.id) ?? null, student: db.students.find((s) => s.id === p.studentId)! })),
        founderVerified: venture.yspaceVerified && venture.founders.length > 0,
      };
    });
  },

  async ventureProjects(id) {
    return read(z.array(ProjectCard), (db) => {
      const student = currentStudent(db);
      return db.projects.filter((p) => p.ventureId === id && p.status === "open").map((p) => card(db, p, student));
    });
  },
};

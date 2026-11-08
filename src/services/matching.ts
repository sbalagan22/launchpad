import { MatchSchema } from "@/schemas/views";
import { computeMatch } from "@/lib/matching";
import type { MatchingApi } from "./contract";
import { ServiceError, read } from "./core";

export const matching: MatchingApi = {
  async matchFor(studentId, projectId) {
    return read(MatchSchema, (db) => {
      const s = db.students.find((x) => x.id === studentId);
      const p = db.projects.find((x) => x.id === projectId);
      if (!s || !p) throw new ServiceError("not_found", "Student or project not found.");
      return computeMatch(s, p, db.certClaims.filter((c) => c.studentId === s.id), db.catalog);
    });
  },
};

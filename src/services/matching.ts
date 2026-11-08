import { MatchSchema } from "@/schemas/views";
import type { MatchingApi } from "./contract";
import { ServiceError, read } from "./core";
import { matchOf } from "./helpers";

export const matching: MatchingApi = {
  async matchFor(studentId, projectId) {
    return read(MatchSchema, (db) => {
      const s = db.students.find((x) => x.id === studentId);
      const p = db.projects.find((x) => x.id === projectId);
      if (!s || !p) throw new ServiceError("not_found", "Student or project not found.");
      return matchOf(db, s, p);
    });
  },
};

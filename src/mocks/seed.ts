import type { Db } from "@/schemas";
import { seedBusinesses, seedReviewers, seedVentures } from "./businesses";
import { seedStudents } from "./students";

/** MOCK: STUB while seeds are finished. Builds only the people and organizations for now. */
export function buildSeed(): Db {
  return {
    students: seedStudents(), businesses: seedBusinesses(), reviewers: seedReviewers(), ventures: seedVentures(), projects: [], applications: [], threads: [], reviews: [],
    notifications: [], catalog: [], certClaims: [], submissions: [], evaluations: [], checks: [], badges: [], pipeline: [], saved: [],
  };
}

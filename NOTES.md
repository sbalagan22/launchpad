# Data and services notes (Person A)

Branch: `york-data`. Contract: `src/services/contract.ts` (names and signatures frozen; add, never rename).

## Status
- Contract ready. All services in `src/services/index.ts` exist. `auth` and `admin` are real. The rest are stubs that reject with `ServiceError("not_implemented")` until their commits land. Watch the git log for each service going live.
- `npm run typecheck:data` (tsconfig.data.json) typechecks only the data layer and must stay green. The full `npm run typecheck` includes the old pages and components, which still import the removed services and will fail until the UI migrates to the contract.

## Schema changes (read these)
- `ProjectStatus` now includes `"draft"`. `projects.create` makes a draft, `projects.publish` opens it (skill yield >= 60 required).
- `HiringEntry.applicationId` added (optional).
- Skills trust is `"reviewed" | "self"`. Certification tier is `"issuer" | "self"` and status is `"earned" | "in_progress" | "planned"`.
- `Business.kind` is gone: use `employerType`, `alumniOwned`, `nearCampus`. `Student.school` is gone: use `program`, `faculty`, `campus`.
- `Db` gained `reviewers, ventures, evaluations, pipeline, saved, catalog` (certifications renamed to `catalog`).
- `CheckResult` is reachability only (`ok | slow | unreachable`). There are no quality scores.
- Session role is `"student" | "business" | "reviewer"`. `auth.loginDemo("poster" | "founder")` both map to `business`.
- New views live in `src/schemas/views.ts`. `Match` is now `{ score, breakdown }` (was `{ percent, ... }`).

## Other files touched outside the ownership list
- `src/lib/trust.ts` (skill trust helper, tied to the schema change), `package.json` (scripts, vitest), `tsconfig.data.json`.
- `src/app/api/**` will be updated for the AI and verification server routes (server code only, no UI).
- `src/store/index.ts`: demo ids for the founder and reviewer accounts.

## Demo accounts
student `stu_aisha`, poster `biz_corner` (Corner Press Coffee), founder `biz_reroute` (Reroute), reviewer `rev_noor`.

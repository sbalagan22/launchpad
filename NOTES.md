# Data and services notes (Person A)

Branch: `york-data`. Contract: `src/services/contract.ts` (names and signatures frozen; add, never rename).

## Status
- All services in `src/services/index.ts` are implemented against the frozen contract (auth, admin, projects, scoping, applications, workspace, review, certs, startups, pipeline, profile, impact, matching, search, notifications).
- Checks that pass: `npm run typecheck:data`, `npm run validate` (referential integrity over the seed), `npm run test:unit` (22 tests: skill yield, matching cert boost, SSRF guard, pipeline transitions, publish gate, pay rules, issuer verification pass and fail).
- The full `npm run typecheck` includes the old pages and components and stays red until the UI migrates to the contract (Person B).

## Mocked
- Everything runs on seeded data in the browser (Zustand persist). Latency is simulated (300 to 900 ms).
- Poster-side scoping streams pre-written briefs (`DEMO_SCRIPTS`) unless `USE_REAL_AI=true` (then `/api/ai/scope`, validated with Zod, mock fallback on any error).
- Issuer verification is a deterministic mock over each catalog entry's `demoIds` plus format patterns, unless `USE_REAL_VERIFY=true` (then `/api/verify`, SSRF-guarded allowlist, never falls back silently).
- Payouts are visual only. York email check is a regex, with demo accounts bypassing it.

## Known gaps
- Catalog entries with unconfirmed verification method: isc2-cc, pcep, pcap, cka-kcna, tf-assoc (flagged `verificationConfirmed: false`).
- Real verification only parses a small allowlist of issuer hosts, and the page markup may change.
- The old `/api/ai/proposal` route and `lib/ai-server.ts` proposal helper are leftovers; students get no AI-made deliverables or proposals from the new contract (`applications.draftProposal` is a template).

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
- `src/app/api/ai/scope`, `src/app/api/verify` (server routes), `src/lib/verify-*.ts`, `vitest.config.mts`.
- `src/store/index.ts`: demo ids for the founder and reviewer accounts.

## Demo accounts
student `stu_aisha`, poster `biz_corner` (Corner Press Coffee), founder `biz_reroute` (Reroute), reviewer `rev_noor`.

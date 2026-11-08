# Launchpad (York University)

A mock-first prototype where York students complete small, real, reviewed projects for York units, professors, local businesses, nonprofits and YSpace startups. Everything runs in the browser on seeded data. There is no database and no real auth.

## Run
```
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run lint
npm run validate     # referential integrity over the seed data
npm run test:unit    # vitest
npm run test:e2e     # playwright demo path
```

## Real vs mocked
| Area | Status |
| --- | --- |
| Data | MOCK: seeded in `src/mocks`, persisted in localStorage (Zustand). Reset from the admin tools. |
| Auth | MOCK: demo accounts sign in with one click. Sign-up checks the York email shape (`@yorku.ca`, `@my.yorku.ca`) with a regex only. |
| Latency | MOCK: every service call waits 300 to 900 ms. |
| Scoping (poster side only) | MOCK by default (`DEMO_SCRIPTS` stream the two demo briefs). `USE_REAL_AI=true` calls Claude through `/api/ai/scope`, validated with Zod, falling back to the mock on any error. AI never produces a student deliverable. |
| Issuer verification | MOCK by default: each catalog entry has one passing and one failing demo credential. `USE_REAL_VERIFY=true` fetches real issuer pages through `/api/verify` (allowlisted hosts, https only, port 443, no credentials, same-host redirects, 5s timeout, 200KB cap). Real mode never falls back to the mock silently. |
| Certifications | Two honest tiers only: "Issuer verified" and "Not verified". Uploading a file never verifies anything. |
| Skill yield | Computed 0 to 100 from the project. Projects need 60 or more to publish. Repetitive admin work is capped below that. |
| Reviews | Human reviewer scores a rubric per milestone, then final approval. Payout release is visual only. |
| Email, payments, file storage | MOCK |

## Demo accounts
Student Aisha Khan (`stu_aisha`), poster Corner Press Coffee (`biz_corner`), founder at Reroute (`biz_reroute`), reviewer Noor (`rev_noor`).

## Demo script
1. Poster: describe "fill the Tuesday night gap" and the scripted brief (skill yield 87) streams in. Publish.
2. Student (Aisha): the new listing appears first with a match score. Apply, and accept as the poster.
3. Student submits a milestone URL (Basic check is reachability only), reviewer Noor scores the rubric and approves, then final approval issues the skill badge.
4. Founder (Reroute): scope "instrument the waitlist", move a candidate to Trial, invite to continue.

The two demo briefs are created live and are not in the seed, so the demo does not duplicate them.

## Certification catalog
16 entries. Prices were checked in November 2026 and are shown as ranges where issuers vary. Entries whose verification method was not confirmed are flagged in the data and in the UI: `isc2-cc`, `pcep`, `pcap`, `cka-kcna`, `tf-assoc`. Launchpad does not issue, grade or test any certification.

## Layout
`src/schemas` Zod types, `src/services` the frozen service contract and implementations, `src/mocks` seed data, `src/lib` skill yield, matching, dates, verification guard, `scripts` validation, `tests/unit` vitest, `tests/e2e` playwright. See `NOTES.md` for schema changes.

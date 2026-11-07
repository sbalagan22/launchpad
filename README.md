# Launchpad

Students get their first real experience by completing scoped projects for small businesses and nonprofits, then earn verified skills on a public profile. Built for the Learning, Work and Opportunity track (UN SDG 4, 8, 9, 10).

This is a **mock-first build**: the whole product runs on rich, hand-written seed data and simulated services. No database or backend is required, and it deploys to Vercel as-is.

## Run it

```bash
npm install
npm run dev                # http://localhost:3000
npm run typecheck && npm run lint && npm run build
npm run validate:mocks     # referential-integrity check for the seed data
npm run test:e2e           # Playwright: demo path + smoke test (builds and serves on :3100)
```

Requires Node 20.9+. `package.json` pins `magic-string@0.30.21` through `overrides`, because Tailwind's PostCSS plugin fails with the ESM-only 1.x line on Node 22.11 and earlier.

### The 2-minute demo path

1. Landing, **I'm a business**, the bakery request is prefilled, **Scope project**, review, **Publish project**.
2. Click **Student view** (Aisha Khan). The new project is first in her feed with a high match %.
3. Open it, **Apply**, the proposal is drafted and streamed, **Send proposal**.
4. **Continue as Sunrise Bakery**, select Aisha, **Accept**.
5. **Student view**, Workspace, open the project, **Submit for review** (the default link is a known demo URL). The check animation runs, then the results.
6. **Business view**, **Approve and release $400**, give 5 stars and a review.
7. Open Aisha's public profile (`/u/aisha-khan`): Web Development is now **Skill checked** with the bakery project as evidence. Finish on **Impact**.

Hidden dev menu: **Ctrl+Shift+D** (Cmd+Shift+D on macOS) with **Reset demo data** and a switcher for any seeded user.

## Architecture

```
src/schemas/    Zod schemas, one per entity (+ views.ts for service outputs)
src/mocks/      typed, hand-written seed modules; seed.ts assembles and reconciles them
src/services/   async service layer (300-900 ms simulated latency); pages only import from here
src/store/      Zustand store persisted to localStorage (db, session)
src/components/ UI kit (components/ui) and feature components
src/app/        Next.js App Router pages, plus /api/ai/* for the real-AI path
scripts/        validate-mocks.ts
tests/e2e/      Playwright
```

- Every service validates inputs and outputs with Zod. Pages never import `src/mocks`.
- Dates in the seed are computed relative to when the seed is built, so the data always looks current. Reset rebuilds it.
- Design source: `launchpad_mock/Launchpad v2.dc.html` (v1 ignored). Tokens live in `src/app/globals.css` (`@theme`). Brand: white, black text, Stripe purple `#635BFF`, Hanken Grotesk, Lucide icons, no emojis. The logo is used unchanged.

## AI modes

`USE_REAL_AI=false` (default) returns pre-written responses with a typing/streaming effect. With `USE_REAL_AI=true` and `ANTHROPIC_API_KEY` in `.env.local` (see `.env.example`), the server routes `/api/ai/scope` and `/api/ai/proposal` call the Anthropic Messages API. Scoping uses forced tool use with a JSON schema generated from the Zod `ScopeResult` schema and re-validates the output. **Any error, timeout, or invalid output falls back to the mock response.** The real path is implemented but could not be exercised without a key; the fallback was tested. Every AI output shows "AI-generated, please review".

## What is real vs simulated (MOCK)

Every simulated piece is marked with a `// MOCK` comment in the source.

| Area | Real | Simulated |
| --- | --- | --- |
| Data | Zod-validated entities, referential integrity, persistence in the browser | All entities are hand-written seed data (12 students, 15 organizations, 30 projects, 40 applications, 15 threads, 20 reviews, 25 notifications, 20 certifications, 10 submissions with checks). `src/mocks/*` |
| Latency | | 300-900 ms delay on every service call. `services/core.ts` |
| Auth | Session switching | No authentication. Any credentials sign in as a seeded user. `login/page.tsx`, `services/misc.ts` |
| Matching | Real scoring: 75% skill overlap weighted by trust level plus related-skill credit, 25% availability and pay preference | Inputs are mock profiles. `services/matching.ts` |
| AI scoping | Real model call when enabled | Four pre-written scopes (bakery website, nonprofit social media plan, landscaping logo, dental data cleanup) plus keyword-templated scopes. `mocks/scopes.ts` |
| AI proposal | Real model call when enabled | Templated from the real profile and project. `mocks/proposal.ts` |
| Publishing | Project appears in the student feed instantly | "Matching students notified" and two other students applying are simulated. `services/projects.ts` |
| Deliverable check | | No site is fetched. Known URLs return hand-written results; unknown URLs get a deterministic score from a hash of the URL; `.invalid`, `localhost`, and hosts containing `broken`/`404`/`down` fail as unreachable. `services/checks.ts`, `mocks/checks.ts` |
| Payments | | "Approve and release $X" is visual only. No Stripe, no money moves. |
| Issuer verification | | Lookup accepts a fixed set of demo credential IDs (e.g. `GUX-48213-AK`, `AI900-90317`). Mismatched names are rejected. `mocks/certifications.ts`, `services/certs.ts` |
| Skill check | | 3-question hand-written quiz per field, pass mark 2 of 3. `services/certs.ts` |
| Self-reported certs | Stored with an optional file name | Files are stored by name only and **never** mark a cert verified. |
| Files | | Submissions store file names only, nothing is uploaded. |
| Certification links | Real provider pages (Coursera, AWS, Microsoft, HubSpot, freeCodeCamp, Figma, Canva, Skillshop) | Estimated hours are approximate. Links were not re-checked at build time. |
| Impact page | Computed from the entities | The entities are simulated. |

## Trust levels

Issuer verified (confirmed with the issuer), Skill checked (passed a reviewed project or a quiz), Self-reported (typed by the student, labeled unverified). Anything a student types is always self-reported. A project review upgrades the project's badge skills to Skill checked with evidence.

## Decisions made while building

- `launchpad_mock/Launchpad v2.dc.html` is the source of truth. Pages it does not cover (login, impact, messages, notifications, applicant accept/reject, check progress, 3-tier cert flow, profile edit, dev menu) reuse its tokens and patterns.
- Milton and Oakville became Brampton and Mississauga; business names kept. Cities are restricted to Brampton, Mississauga and Toronto.
- Aisha's seeded active project is "Newsletter email template" (Peel Youth Hub) so the demo's Bakery website is not a duplicate. Her summary (Active 1, Applied 2, Completed 2, 18 verified hours) is computed from the seed. Her Web Development skill starts self-reported.
- Projects posted in the last 24 hours are pinned first in the student feed, then ranked by match %.
- The submit form has a "final delivery" checkbox (on by default) that covers all remaining milestones so the demo needs a single approval. Untick it for milestone-by-milestone work.
- Accepting an applicant automatically declines the others and creates the chat thread.
- Volunteer projects are enforced for nonprofits only, in the UI, the service, and the integrity script. Projects are capped at 25 hours.
- Business `rating` values are seed values; student review averages are computed.

## Known gaps

- The real-AI path is untested against the live API (no key available during the build).
- Single-browser persistence: data lives in localStorage, so separate browsers do not share state.
- No automated visual-regression testing; accessibility was handled by construction (labels, roles, focus management, contrast tokens) and not audited with a tool.
- Public profile QR codes link to the current host, which is only reachable by others when deployed.

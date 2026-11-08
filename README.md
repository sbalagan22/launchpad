# Launchpad

A mock-first prototype where York students complete small, real projects for York units, professors, local businesses, nonprofits and YSpace-style startups. Everything runs in the browser on seeded data: no database, no real auth.

This is an independent student project. It is not affiliated with York University or YSpace. All people, posters and ventures are fictional.

## Run
```
npm install
npm run dev          # http://localhost:3000
npm run typecheck && npm run lint && npm run build
npm run validate     # referential integrity over the seed data
npm run test:unit    # vitest
BASE_URL=http://localhost:3000 npm run test:e2e   # playwright demo script (normal and reduced motion)
```

## Demo accounts
Aisha Khan (CS student), Priya Nair (business student) and Omar Haddad (founder, Reroute). The source of truth is `demo_personas.md`.

## Real vs mocked
| Area | Status |
| --- | --- |
| Data | MOCK: seeded in `src/mocks`, persisted in localStorage. Use the dev menu (Ctrl or Cmd + Shift + D) to reset. |
| Auth | MOCK: one click per demo account. Sign-up checks the York email shape with a regex only. |
| Latency | MOCK: every service call waits 300 to 900 ms. |
| Poster-side AI | MOCK by default (scripted, streamed briefs). `USE_REAL_AI=true` calls Claude through `/api/ai/scope` with Zod validation and a mock fallback. AI never writes or fixes a student deliverable. |
| Issuer verification | MOCK by default: demo IDs and URL patterns, one passing and one failing sample per entry. `USE_REAL_VERIFY=true` fetches allowlisted HTTPS issuer pages only (5s timeout, 200KB cap, no cross-domain redirects, no private IPs) and never silently falls back to the mock. |
| Certifications | Two tiers only: Issuer verified (red check) and Not verified. Status (earned, in progress, planned) is separate. An uploaded file never verifies anything. |
| Evidence | Means approved by the poster. Profiles say so. |
| Publish gate | A brief needs deliverables, at least 2 milestones, hours of 25 or fewer, 3 to 5 acceptance criteria and a pay line. Missing items are listed in plain words. No scores are shown. |
| Payments, email, file storage | MOCK |

## Demo script
1. Omar posts "Instrument the Waitlist" from a streamed brief and publishes.
2. Aisha sees the new match and applies.
3. Omar accepts her and approves her pending Reroute milestone 2 with ratings and a review.
4. Aisha submits milestone 3, Omar gives final approval, the badge unlocks and the evidence appears on her profile. She adds GitHub Foundations with the passing demo ID, and a failing ID falls back to self-reported.
5. Omar moves her to Trial and sends Invite to continue.
6. Priya: workspace, thread with Omar, certification roadmap. End on Impact.

"Instrument the Waitlist" and "Fill the Tuesday Night Gap" are created live from scripted briefs and are not seeded.

## Certification catalog
16 entries. Prices were checked in November 2026: confirm with each issuer. Entries whose verification method is unconfirmed: ISC2 CC (`isc2-cc`), PCEP (`pcep`), PCAP (`pcap`), KCNA (`cka-kcna`) and Terraform Associate (`tf-assoc`). Free for students: freeCodeCamp, and GitHub Foundations for verified GitHub Education students. Launchpad does not issue, grade or test any certification.

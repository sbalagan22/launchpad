# Notes

## What changed
- Removed the reviewer role, rubric review, skill yield score, search bar and Cmd+K palette, footer, the startups directory page and the old demo roles. Match score is the only score.
- Posters approve milestones: they rate each acceptance criterion (1 to 5) and write a short review. Approving the last milestone completes the project, issues badges and creates the review.
- Seed data rebuilt from `demo_personas.md` (24 students, 13 posters plus 10 ventures, 60 projects, 104 applications, 30 threads, 39 notifications, 16-entry catalog, hiring pipeline with 4 invites).
- New services: `approvals`, `messages`. `scoping` suggests improvements without scores. `projects.checkPublish` lists missing items.
- New pages: workspace, messages, founder dashboard and pipeline, business projects, approvals, poster flow, certifications (roadmap, catalog, drawer, pathways, add flow), public profile with QR, venture profile, filter side panel on the feed.
- Logo: `public/Launchpad_logo.png` (transparent) is used everywhere, including the favicon.

## Schema changes
`Reviewer`, `Evaluation`, `rubric` and `reviewerIds` are gone. Added `Approval`, `acceptance`, `difficulty`, `locationMode`, thread `unread` and message `attachments`, venture `location`, `foundedAt`, `waitlist`, student `city`, `github`, `linkedin`, `languages`, `interests`, cert claim `note`, `targetDate`, invite `status`. Session role is `student | business`.

## Fell short of the targets
- Workspaces: 32 (target 40). Reviews: 19 (target 35), because reviews exist only for completed projects and 27 projects must stay open for a rich feed.
- Descriptions are 104 to 177 words (target 150 to 250); the shortest are on the simpler projects.
- Applications: 104 (target 90), because each startup pipeline needs 6 or more candidates.
- Instrument the Waitlist scores 81 to 88 for Aisha depending on the date.

## Known gaps
- No pagination beyond "load more" on the feed.
- Mobile layouts under 400px were not audited page by page.
- Messages attachments are labels only.
- Real verification parsing depends on issuer page markup.

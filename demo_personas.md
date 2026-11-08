# Demo personas and mock world (single source of truth)

Attach this file to Claude Code. All seed data for the three demo accounts comes from here. Everything is fictional demo data. Dates are relative to "today" (Nov 2026). Keep names, titles and numbers consistent across pages, messages, reviews and notifications.

Demo accounts (login switcher shows these three, nothing else):
1. Student, CS: Aisha Khan
2. Student, Business: Priya Nair
3. Founder, YSpace-style startup: Omar Haddad (Reroute)

There is no reviewer role. The poster (founder, prof, club lead, owner) approves milestones and writes the review. A project's "rubric" is just the acceptance criteria the poster checks (3 to 5 plain-language items) and rates when approving.

---

## 1. Aisha Khan (student, CS)
- York Verified, aisha.khan@my.yorku.ca (demo). BSc Computer Science (Honours), Lassonde School of Engineering, 2nd year, Keele campus. Lives in Brampton, commutes. Available 10 hrs/week. Wants paid or stipend. Slug: aisha-khan.
- Bio: "2nd year CS student who likes building things people actually use. Looking for my first real project experience. Comfortable with React and Python, learning backend."
- Skills (with levels): HTML/CSS (strong), JavaScript (strong), React (intermediate), Python (intermediate), Git (intermediate), SQL (beginner), Node/Express (beginner), Figma basics.
- Certifications:
  - freeCodeCamp Responsive Web Design: earned, issuer verified (issued Mar 2026, no expiry).
  - GitHub Foundations: planned (target Jan 2027).
  - Microsoft Azure Fundamentals AZ-900: in progress, self-reported ("studying, exam booked Dec 2026").
  - MongoDB Associate Developer: planned.
- Completed projects (with poster reviews):
  1. "Refresh the Robotics Club Website" (York Robotics Club, york_unit), 14 hrs, $280 stipend, finished Sep 2026. Review 4.5 of 5 from club president Jordan Lee: "Delivered the site two days early and documented how to update it. Handled feedback well."
  2. "Turn the Lab's Survey Results into Charts" (Prof. Elaine Whitford's psychology lab, professor), 10 hrs, $200, finished Oct 2026. Review 4 of 5 from Prof. Whitford: "Clean charts and a clear README. Next time, ask about edge cases earlier."
- In progress: "Ship the First Real Version of Reroute" (Reroute, 25 hrs, $500). Milestone 1 (scope and data audit, 4h) approved. Milestone 2 (core flow and map view, 12h) submitted, awaiting Omar's approval. Milestone 3 (alerts and deploy, 9h) locked.
- Applied (pending): "Make the Board Read the Dashboard" (Northgate Community Food Bank), applied 3 days ago.
- Saved: 5 projects (Break Our Game Before Players Do, Fill the Tuesday Night Gap is NOT seeded, Replace the Emailed CSVs, Founder Demo Day Site and Pitch Assets, a QA project, a data viz project).
- Dashboard stats: 2 completed, 1 active, 1 applied, 24 verified hours, average review 4.25.
- Match scores (examples): Reroute MVP 94, Instrument the Waitlist 88, Replace the Emailed CSVs 86, Break Our Game 79, Board Dashboard 72, Pricing for Transit Agencies 31.
- Message threads (4):
  1. Omar Haddad, project "Ship the First Real Version of Reroute". Last message from Omar yesterday: "Milestone 2 looks great. The map view loads fast. I'll review properly tonight." Earlier messages cover scope questions: which transit data feed (a public GTFS feed), mobile-first, deploy on Vercel.
  2. Jordan Lee (Robotics Club): thank-you thread, last message from Jordan: "The site's been getting compliments. Can we hire you again in January?"
  3. Prof. Elaine Whitford: short thread, asking whether Aisha can present charts at lab meeting.
  4. Northgate Community Food Bank (Hannah Boateng, operations lead): "Thanks for applying. We will pick someone by Friday."
- Notifications (sample): "Omar viewed your milestone 2 submission", "New match: Instrument the Waitlist (88)", "Your freeCodeCamp certification is issuer verified", "Reminder: Reroute milestone 3 opens after approval".

## 2. Priya Nair (student, Business)
- York Verified, priya.nair@my.yorku.ca (demo). BBA, Schulich School of Business, 3rd year, specialization in Marketing, Keele campus. Lives near campus. Available 8 hrs/week. Wants paid or stipend. Slug: priya-nair.
- Bio: "Schulich marketing student who likes figuring out why customers do what they do. Looking for real research and strategy work with early-stage teams."
- Skills: market research (strong), customer interviews (strong), Excel (strong), PowerPoint storytelling (strong), pricing basics (intermediate), SQL (beginner), Canva (intermediate).
- Certifications:
  - Google Data Analytics Professional Certificate: earned, issuer verified (issued Jun 2026).
  - Professional Scrum Master I: planned.
  - Microsoft Power BI Data Analyst PL-300: in progress, self-reported.
- Completed projects:
  1. "Sponsorship Deck and Outreach for the Schulich Case Club" (york_unit), 12 hrs, $240, finished Oct 2026. Review 5 of 5 from the club VP Marcus Chen: "Raised our first sponsor within two weeks of using her deck."
- In progress: "Customer Discovery and Pricing for Reroute's Transit Agency Pilot" (Reroute, 18 hrs, $360). Milestone 1 (interview plan and 8 interviews, 8h) in progress, due in 5 days. Milestones 2 and 3 locked.
- Applied (pending): "Pricing and Customer Interviews for Harvest Loop" (agri-food venture), applied 2 days ago.
- Saved: 4 projects (business and marketing flavoured).
- Dashboard stats: 1 completed, 1 active, 1 applied, 12 verified hours, average review 5.0.
- Match scores: Reroute discovery and pricing 92, Harvest Loop pricing 90, Demo Day pitch assets 76, Instrument the Waitlist 38, Reroute MVP 22.
- Message threads (3): Omar Haddad (interview plan feedback, he introduces two transit contacts), Marcus Chen (case club follow-up), Harvest Loop founder Lina Okafor (scheduling an intro call).
- Notifications: "Omar shared 2 contacts for your interviews", "Harvest Loop viewed your application", "Google Data Analytics added to your profile".

## 3. Omar Haddad (founder, Reroute)
- York alumnus (BSc Computer Science, 2023), co-founder and CEO of Reroute. Based at the YSpace-style incubator in Markham. Slug: omar-haddad. "Founder verified" badge (demo pre-verified).
- Venture: **Reroute**. Pitch: "Real-time rerouting for transit riders. We tell you the faster way before you are stuck on the platform." Sector: mobility. Stage: prototype heading to pre-seed. Team: 3 (Omar CEO, Sana Iqbal CTO, one part-time designer). 214 people on the waitlist. Stack: React, TypeScript, Node, PostgreSQL, Mapbox, a public GTFS feed. Location: Markham. Founded Feb 2026. Lessons: wants to run a 6 week pilot with a regional transit agency by early 2027.
- Co-founder bio (Sana Iqbal, CTO): ex-intern, York alumna, handles backend. Both appear on the venture profile.
- Projects posted:
  1. "Ship the First Real Version of Reroute": in progress with Aisha (milestone 2 awaiting approval). 25 hrs, $500. Acceptance criteria: works on a phone, shows a delay and one alternative route for 3 real routes, loads under 3 seconds, README explains how to run it, code is committed in small readable commits.
  2. "Customer Discovery and Pricing for Reroute's Transit Agency Pilot": in progress with Priya. 18 hrs, $360. Criteria: 8 interviews completed with notes, 1 page of findings, pricing options with reasoning, 5 slide recommendation.
  3. "Instrument the Waitlist": **not seeded**. Created live in the demo. 14 hrs, $280. Skills: analytics events, SQL, funnel analysis, memo with 3 recommendations.
  4. "Founder Demo Day Site and Pitch Assets": open, 3 applicants (all fictional students), 16 hrs, $320.
- Past completed projects posted (2): "Fix the Mobile Layout Bugs" (completed Sep 2026, student Daniel Osei, reviewed 4 of 5) and "Waitlist Landing Page Copy Test" (completed Aug 2026, student Mei Lin, reviewed 5 of 5).
- Hiring pipeline (9 candidates): Applied 3 (for Demo Day assets), Interviewing 2, Trial 2 (Aisha on the MVP, Daniel Osei), Offer 1 (Mei Lin was sent an "Invite to continue" for a 4-month part-time role, status pending).
- Dashboard stats: 4 projects posted, 2 active, 2 completed, 9 candidates, 27 total student hours delivered, average review given 4.5.
- Message threads (4): Aisha (above), Priya (above), Daniel Osei (follow-up on a bug fix), Mei Lin (invite to continue).
- Notifications: "Aisha submitted milestone 2", "Priya posted her interview plan", "3 new applicants for Demo Day assets", "Mei Lin viewed your invite".

---

## Shared world (for feeds and directories)
Other ventures (fictional): Harvest Loop (agri-food, founder Lina Okafor, restaurant supply pricing), PulseDesk (healthtech, appointment reminders), Ledgerly (fintech, invoicing for freelancers), Tidewell (climate, home water-use insights), Fernwood Labs (AI tools, document summaries), Plantlane (agri-food, community garden planning), Signalbox (mobility, e-bike fleet maintenance), Brightpath (edtech, tutoring marketplace for newcomers). Each has 1 to 2 open projects, founders with short bios, a stage, sector and stack.
Other posters: Corner Press Coffee (owner Dana Kowalski, near campus), Northgate Community Food Bank (Hannah Boateng), Paper Lantern Games (alumni-run indie studio, lead Theo Park), Prof. Elaine Whitford (psychology lab), York Robotics Club (Jordan Lee), Schulich Case Club (Marcus Chen), Finch Community Kitchen (nonprofit), a York department communications office.
Other students (about 20 across Lassonde, Schulich, LA&PS, AMPD, Science, Health, Education, EUC, Glendon): include Daniel Osei (Lassonde, 3rd year, frontend), Mei Lin (LA&PS, communications, 4th year), and varied names for the rest. They appear as applicants, past reviewers' subjects, and in the pipeline.
Project mix for the feed: 60 projects. About 20 CS and engineering, 12 business, 8 psychology and health, 8 design and media, 6 languages and humanities, 6 science. Each has hook, description, deliverables, 3 milestones with hours, skills, tools, pay, deadline, acceptance criteria, strengthened-by certs, and the poster.

## Demo script
1. Log in as Omar. Post "Instrument the Waitlist" with the AI-scoped brief (streamed). Publish.
2. Log in as Aisha. See the new match (88), apply with a short note.
3. Back as Omar: accept her, then open her pending Reroute MVP milestone 2, approve it with a short review.
4. As Aisha: milestone approval notification, finish the project path, badge unlock animation, evidence on her public profile, then add GitHub Foundations through the issuer-verification flow with the passing demo ID.
5. As Omar: move Aisha in the pipeline to Trial, send "Invite to continue".
6. As Priya: show her in-progress discovery project, the messages thread with Omar, and her certification roadmap.
7. End on the impact page.

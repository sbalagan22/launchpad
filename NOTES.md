# Notes

## UI summary and known gaps

**Test runs (Playwright, Chromium, 2 tests: demo path and page smoke/reset)**

| Mode | Command env | Result |
| --- | --- | --- |
| Mock AI (default) | `USE_REAL_AI=false` | 2 passed |
| Real-AI enabled | `USE_REAL_AI=true` with a dummy `ANTHROPIC_API_KEY` | 2 passed (API call fails, falls back to mock) |

No failures, so no code fixes were needed.

**UI covered**: landing, login, onboarding, student feed with match %, project detail, workspace with deliverable check panel, skills, profile and public profile (`/u`), messages, notifications, business flows, AI project creator, impact page. The e2e test walks bakery request to verified badge.

**Known gaps**
- The real-AI mode was run only with an invalid key, so it proves the fallback and not the live Anthropic response.
- State is in localStorage, so browsers do not share data.
- No visual-regression tests and no accessibility audit with a tool.
- Test coverage is one end-to-end path plus a smoke test. Applicant reject, milestone-by-milestone submission, and messaging are not asserted.
- Public profile QR codes only work for others once deployed.
- `npm ci` fails because `package-lock.json` lacked optional platform packages. `npm install` updated it.

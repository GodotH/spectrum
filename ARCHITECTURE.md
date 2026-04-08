# SPECTRUM Architecture

## Overview

SPECTRUM is a single-page React application implementing 6 validated autism screening questionnaires with a cyberpunk terminal UI. Built with React 18, TypeScript, Vite, Tailwind CSS, and Framer Motion.

## Live

- **URL**: https://spectrum.detectd.app
- **Repo**: https://github.com/GodotH/spectrum
- **Hosting**: Vercel (auto-deploys on push to `master`)
- **DNS**: Cloudflare CNAME `spectrum.detectd.app` → `cname.vercel-dns.com` (proxy OFF)

## Directory Structure

```
spectrum/
├── public/
│   └── favicon.svg              # Green > prompt favicon
├── src/
│   ├── components/
│   │   ├── WelcomeScreen.tsx     # Boot animation, name input, test selection, disclaimer
│   │   ├── QuestionScreen.tsx    # Question display, answer grid, review grid, quit dialog
│   │   ├── ResultsScreen.tsx     # Score display, context bars, subscales, battery flow
│   │   ├── HistoryScreen.tsx     # Past results table
│   │   └── ExportDialog.tsx      # PDF export selection modal
│   ├── data/
│   │   ├── aq50.ts               # AQ-50 questions (50 items, 5 subscales)
│   │   ├── catq.ts               # CAT-Q questions (25 items, 3 subscales)
│   │   ├── raadsr.ts             # RAADS-R questions (80 items, 4 subscales)
│   │   ├── eq.ts                 # EQ questions (60 items, 20 filler)
│   │   ├── sq.ts                 # SQ-R questions (75 items)
│   │   └── rbq2a.ts              # RBQ-2A questions (20 items, variable answer options)
│   ├── hooks/
│   │   └── useQuestionnaire.ts   # Main state machine (screens, answers, battery, save/resume)
│   ├── types/
│   │   └── index.ts              # TestType, AnswerOption, Question, TestResult, TEST_MENU
│   ├── utils/
│   │   ├── scoring.ts            # Per-test scoring, thresholds, interpretation, norm data
│   │   ├── storage.ts            # localStorage persistence (results, in-progress, disclaimer)
│   │   └── pdf.ts                # Single and combined PDF export via jsPDF
│   ├── App.tsx                   # Root component, screen router
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Theme colors, CRT effects, animations
├── index.html                    # HTML entry with meta/OG tags
├── vite.config.ts                # Vite + React + Tailwind
├── package.json                  # Dependencies
└── tsconfig.*.json               # TypeScript config
```

## State Machine

The app is driven by `useQuestionnaire.ts` which manages:

```
welcome → questionnaire → results → welcome (loop)
                ↑                       |
                └── battery: auto-advance between tests
```

### Key State
- `screen`: `welcome | questionnaire | results | history`
- `testType`: Current active test
- `testQueue`: Array of tests to run (battery mode)
- `queueIndex`: Current position in battery
- `answers`: Array of `{ questionId, value }` for current test
- `result`: Completed TestResult (saved to localStorage)

### Auto-save
Every answer triggers `saveInProgress()` to localStorage. On crash/close, the WelcomeScreen detects saved state and offers RESUME/DISCARD.

## Tests — Data Integrity

All 6 tests verified against published papers (Opus stack audit, 2026-04-08):

| Test | Items | Subscales | Scoring | Max | Threshold | Reverse Items |
|------|-------|-----------|---------|-----|-----------|---------------|
| AQ-50 | 50 | 5 (10 each) | Binary 0/1 | 50 | 32+ | 26 disagree items |
| CAT-Q | 25 | 3 (9/8/8) | Likert 1-7 | 175 | 100+ | 3,12,19,22,24 |
| RAADS-R | 80 | 4 (7/39/20/14) | 0-3 lifetime | 240 | 65+ | 17 normative items |
| EQ | 60 | none (20 filler) | 0/1/2 agree/disagree | 80 | ≤30 | 19 disagree items |
| SQ | 75 | none | 0/1/2 agree/disagree | 150 | 75+ | 36 reverse items |
| RBQ-2A | 20 | 3 (6/6/8) | 1-3 (variable options) | 60 | 26+ | none |

### Special Cases
- **EQ**: Has 20 filler items (subscale='filler') that always score 0. Inverse test — lower score = more autistic.
- **RBQ-2A**: Variable answer options per question group. Options with value 4 score as 3 (`Math.min(val, 3)`).
- **RAADS-R**: Unique 4-point lifetime scale (True always / True now only / True when young / Never true).

## Scoring (`scoring.ts`)

Each test has its own scoring function:
- `scoreAqAnswer` — binary 0/1
- `scoreCatqAnswer` — Likert with reverse (8-val)
- `scoreRaadsrAnswer` — 4-point with reverse
- `scoreSqAnswer` / `scoreEqAnswer` — 0/1/2 with direction
- `scoreRbq2aAnswer` — direct value capped at 3

### Norm References
`getNormReferences(testType)` returns clinical reference data for the score context bar:
- NT mean, threshold, autistic mean per test
- `inverse` flag for EQ (low score = autistic)

## UI Components

### WelcomeScreen
Boot sequence: SPECTRUM v1.0 → Autism Detection Toolkit (spinner) → Privacy Mode (spinner) → checkmarks → name input → test selection → disclaimer → start.

Key states: `toolkitProgress`, `privacyProgress`, `nameConfirmed`, `showDisclaimer`, `disclaimerAccepted` (persisted).

When returning from ESC/quit mid-test, `initialName` prop skips the boot animation and goes straight to test selection.

### QuestionScreen
Adaptive answer layouts:
- 4 options: 2x2 grid (1-col on mobile)
- 3 options: 3-col grid
- 7 options (CAT-Q): 4+3 rows (2-col on mobile)
- Long labels: auto-detected, smaller text

Features: top bar with SPECTRUM v1.0 / test type / counter / progress, [ESC] quit with confirmation, review grid before submit (shows only unanswered questions).

### ResultsScreen
Score display with ASCII bar + ScoreContextBar (40-char visual showing NT mean / threshold / autistic mean / user position). Subscale breakdown. Battery auto-advance (10s countdown, pausable). Continue section with remaining tests. Export dialog.

### ExportDialog
Checkbox selection of completed results. Single export or combined PDF with cover page.

## CSS Theme (`index.css`)

Custom properties:
- `--color-phosphor`: #00ff41 (primary green)
- `--color-phosphor-dim`: 50% alpha
- `--color-phosphor-faint`: 20% alpha
- `--color-amber`: #ffb000 (accents, key badges, spinners)
- `--color-term-red`: #ff3333 (destructive actions only)
- `--color-terminal-bg`: #0a0a0a
- `--color-terminal-border`: rgba(0,255,65,0.15)

Effects: CRT scanlines (desktop only), vignette, slow-blink cursor (1.5s).

## localStorage Keys

| Key | Purpose | Cleared |
|-----|---------|---------|
| `clinicAutism_results` | Array of completed TestResult objects | Manual delete in history |
| `clinicAutism_inProgress` | Current test state for crash recovery | On finish, quit, or home |
| `spectrum_disclaimer` | `'accepted'` after first disclaimer accept | Never (persists forever) |

## Deployment

### Vercel
- Project: `spectrum` under `vercel-virtuelcas-projects`
- Auto-deploys from GitHub `master` branch
- Build: `tsc -b && vite build`
- Domain: `spectrum.detectd.app`

### Cloudflare DNS
- Zone: `detectd.app` (Cloudflare nameservers)
- Record: `CNAME spectrum → cname.vercel-dns.com` (proxy OFF)
- **WARNING**: Do NOT add `detectd.app` root to Vercel — it hosts dashx infrastructure via CF tunnel

### Related Infrastructure
- `dashx.detectd.app` — OpenClaw dashboard + magicDNA (CF tunnel to remote server `lx`)
- See memory file `reference_dashx_infra.md` for details

## Adding a New Test

1. Create `src/data/newtest.ts` with questions array (follow existing patterns)
2. Add test type to `TestType` union in `src/types/index.ts`
3. Add entry to `TEST_MENU` with label, desc, tooltip
4. Add answer options constant and update `getAnswerOptions()`
5. Add subscale labels to `SUBSCALE_LABELS` if applicable
6. Update `src/utils/scoring.ts`:
   - Add scoring function
   - Add case to `scoreAnswer()`
   - Add to `getMaxScore()`, `getSubscaleMax()`, `interpretScore()`, `getScoreCategory()`, `getNormReferences()`
7. Update `src/hooks/useQuestionnaire.ts` — add import and case to `getQuestions()`
8. Update `src/utils/pdf.ts` — add to `questionMap`, `titles`, `refs` in both export functions

## Known Limitations

- No server-side persistence — all data in localStorage
- No user accounts — single browser, single user
- RBQ-2A per-question answer options require special handling in hook and PDF export
- Framer Motion type conflicts with `ease: 'easeOut'` require `as const` cast
- CRT scanlines disabled on mobile for GPU performance

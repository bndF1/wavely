# Wavely AI Factory and Modernisation Program

*   **Author:** bndF1
*   **Status:** Proposed
*   **Date:** 2026-11-12

--------------------------------------------------------------------------------

## Overview

Wavely is a podcast and internet-radio web app (Angular 21, Ionic 8, Firebase,
hosted on Firebase Hosting as a PWA). Its look follows the discontinued Google
Podcasts. One person owns it and is its only user, mostly on a phone browser and
sometimes on desktop. Work on it stopped in March 2026.

This program restarts the project for two reasons:

1.  **Learning.** The owner wants to practise current agentic development: a
    small team of Claude Code agents (the "factory") that plans, builds, checks
    and releases work, with evidence at every handoff. Wavely is the test bed.
2.  **Product upkeep.** Bring dependencies up to date, make the mobile design
    consistent through design tokens, and turn a stale backlog into planned
    iterations.

The program has four parts, delivered in this order:

| Part | What it delivers | When |
|------|------------------|------|
| A. Factory | Three agent roles, project skills, handoff files (issue and PR templates, iteration records), metric definitions | Iteration 0 |
| B. Release and CI foundations | semantic-release, removal of the `staging` branch, CI fixes, mobile E2E with fixed test data, security cleanup | Iteration 0 (a backlog cleanup runs just before it, §12) |
| C. Dependency upgrade | Major-version upgrades of nine dependencies as a sequence of small PRs that can each be reverted on its own | Iterations 1–4 (TypeScript later, once Angular supports it) |
| D. Design tokens | Spacing and type tokens used on every page, enforced by lint, checked by screenshot baselines | Iteration 4 and later |

Part A is the main subject. Parts B to D are the first real work the factory
does, so they also serve as its first test.

## The Problem

**The documented process and the one that runs have drifted apart, and the
checks that do run miss mobile, visual and token problems.**

*   The docs describe a process the repo does not run.
    *   AGENTS.md, SDD.md and the `wavely-git-flow` skill say releases are
        versioned automatically. In fact there is no semantic-release setup, and
        `ci.yml` (`version-bump-check`) fails every PR to `main` until someone
        bumps the version by hand. Issue #279 is still open.
    *   AGENTS.md says Lighthouse gates PRs to `main`. It only runs after the
        staging deploy (`lighthouse.yml`).
*   The agent instructions are not loaded.
    *   AGENTS.md tells agents to use `wavely-orchestrator`, `wavely-qa`,
        `wavely-design`, `wavely-security` and `wavely-git-flow`. Those live in
        `.github/skills/`, which only GitHub Copilot reads, so Claude Code never
        sees them.
    *   Their content is out of date: they mention Angular 19/20, a theme file
        that does not exist, a selector prefix the app does not use, and version
        1.4.2 (the repo is at 1.9.1).
*   The existing checks do not cover mobile, visual or token problems.
    *   CI runs E2E only on Desktop Chrome. The Pixel 5 and iPhone 12 projects
        run only on a developer machine (`e2e/playwright.config.ts`).
    *   There are no screenshot baselines.
    *   E2E does not run on PRs to `dev`.
    *   Nothing stops a component from using raw pixel or colour values.
*   Facts are spread across five sources that disagree. AGENTS.md, SDD.md, the
    EGM contracts, the Copilot skills and the GitHub milestones contradict each
    other on versions, token locations, routes, CI triggers and releases.

**The product has fallen behind.**

*   Nine dependencies are one or more major versions behind: Angular, Ionic, Nx,
    TypeScript, Firebase, `@angular/fire`, NgRx Signals, Sentry and
    ngx-translate. They are linked: the locked Sentry 10 does not allow
    Angular 22, and Nx must move one major version at a time.
*   Mobile spacing and type are inconsistent (#289, #294). Spacing tokens exist
    in `src/styles.scss`, but there are no type tokens and nothing enforces
    their use.
*   The backlog has 31 open issues. 12 belong to the abandoned "Stitch" design
    direction, 8 to native-app work that no longer fits a web-only personal
    app, and 11 have no milestone.

**There are live risks.**

*   `.mcp.json` holds a real Google API key for the retired Stitch MCP server.
    The file is gitignored and was never committed, but the key is still valid.
*   Dev, PR previews, staging and production use one Firebase project and one
    Firestore database (`wavely-f659c`), and all of them build with the
    production config. Code on any preview or on `dev` writes real data once
    the owner signs in there.
*   The PWA has no update handling, and `ngsw.json` and `index.html` have no
    explicit no-cache rule. An installed app can keep running an old version
    until it has been reopened more than once after a release.

**Proposed solution.** First build the checks and fix the release pipeline,
then add a small agent team that relies on those checks. Use that team to
upgrade dependencies and adopt design tokens in small, released steps. Measure
both the app and the factory from recorded events in GitHub and in local
session logs, not from agents' own summaries.

## Goals

**Factory**

*   Three agent roles (planner, engineer, verifier) in `.claude/agents/`. The
    main Claude Code session acts as the front door. A new role is added only
    when a logged failure shows it is needed.
*   Every handoff produces a file or check, not a conversation:
    *   an issue that meets a written Definition of Ready;
    *   a PR that follows a template (`Closes #N`, validation evidence, design
        verdict, docs and EGM updated);
    *   CI results;
    *   an iteration record in `docs/iterations/NN.md`.
*   One home for each kind of fact:
    *   AGENTS.md holds rules and policy.
    *   `docs/team.md` holds the roster, routing, the Definitions of Ready and
        Done, the cadence and the metric definitions.
    *   The EGM tree (one `EGM.md` per directory, recording that directory's
        interface, invariants and side effects) holds code contracts.
    *   `docs/design/README.md` holds the token spec and the mockup index.
    *   `package.json` holds versions.
    *   GitHub holds the backlog.
    *   Agent and skill files contain no versions, routes or CI tables.
*   Factory metrics, each with a written formula and data source (§11), are
    recorded at the end of every iteration: rework rate, review rounds, cost
    per issue, owner interventions and cycle time. Three of them decide
    whether the factory works:
    *   **Rework rate:** the share of shipped issues whose PR received a
        `rework` label, or that were reopened.
    *   **Cost per issue:** Claude Code cost in the iteration ÷ issues
        shipped, as reported by `ccusage`, plus a per-issue figure for work
        done in a worktree named after the issue.
    *   **Owner interventions:** the number of escalations to the owner, not
        counting required approvals.

**Release and CI**

*   Every merge to `main` that contains a releasable commit is versioned and
    tagged by semantic-release from Conventional Commits. Releasable means
    `feat`, `fix`, `perf`, a revert, or `chore(deps)`/`build(deps)` under the
    release rules. A merge with no releasable commit still deploys and keeps
    the previous version. Every merge is deployed by the production workflow.
    There is no manual version bump.
*   The `staging` branch and its workflow are gone. The flow is `feature/*` →
    `dev` → `main`. Each PR deploys to a Firebase preview channel, where the
    signed-out routes (login, podcast detail, publisher, category) are
    checked. Sign-in, the signed-in tabs and synced data are checked on the
    fixed `dev` channel, whose domain is authorized.
*   E2E runs on PRs to `dev`, on a mobile viewport and one desktop viewport, with
    network calls replaced by fixed test data so results are stable.
*   A `wavely-validate` skill runs locally the same checks as CI, except the
    visual comparison, which runs only in CI's pinned container.
*   The CI defects are fixed: the cache key, the unpinned bun version, and the
    deprecated `FIREBASE_TOKEN`.
*   A production release reaches the owner's installed PWA within two launches
    after the deploy. The first launch downloads it. The next launch or return
    to the foreground applies it, unless audio is playing.

**Product**

*   All nine dependencies are on their current major version, with CI green,
    within iterations 1–4. TypeScript is the exception: it moves only when
    Angular officially supports the new major.
*   Spacing and type tokens are used on every page. The token lint reports 0 raw
    pixel or colour values in component styles. Each page has an
    owner-approved mobile screenshot baseline. #289 and #294 are closed.
*   The backlog has fewer than 20 open issues, each with a priority and an
    iteration.
*   Iterations hold about 4 issues: 1–2 features, 1–2 bug fixes, and security
    work first whenever there is any. Each iteration ends with a production
    release.

**Security**

*   The Stitch API key is revoked and removed from `.mcp.json`.
*   The missing empty-`uid` guard in the Firestore load methods (item 7 of
    `2026-11-12_DRIFT_REPORT.md`, the 2026-11-12 check of the EGM contracts
    against the code) is filed and fixed.
*   Firestore rules deny the collections no client code uses (`queue`,
    `tokens`, `podcasts`, `episodes`).
*   There is a written decision on the third-party `corsproxy.io` used for RSS
    feeds.

## Non-Goals

*   **A large team.** No CEO, growth, devops or privacy roles, and no
    end-user persona. The owner plays the listener.
*   **Native apps.** No push notifications, deep links, app-store submission,
    CarPlay or offline downloads. Releases are web only. Milestones #4 and #5
    (#41–#48) are closed. Sleep timer (#45) and chapters (#46) may come back
    later as web features.
*   **The Stitch design direction.** Milestone #11 (#366–#378) and the Stitch
    skills are removed.
*   **A shared component library.** The existing `src/app/shared/components/`
    stays as it is.
*   **Repainting every screen from a mockup.** Claude Design mockups are made
    for new or changed screens. Existing screens are brought in line through
    tokens and approved baselines.
*   **Copying Google's identity.** The design copies the density and layout of
    Google Podcasts, not its logo, colours, icons or wording. Mockup prompts use
    design principles, not the brand name.
*   **TypeScript 7** unless Angular officially supports it when the upgrade
    reaches that step.
*   **Separate Firebase projects for dev and production.** This is a known,
    open risk. Keeping Firestore changes additive and deploying rules only from
    `main` prevents schema breakage and untested rules in production. It does
    not stop a broken preview or `dev` build from writing bad data to the
    shared database (see Risks & Mitigations).
*   **Factory dashboards** before about iteration 3. A plain-text record per
    iteration is enough until then.
*   **Lighthouse as a hard gate.** It stays a report.

## Open Questions

*   **corsproxy.io:** keep it, or replace it with a first-party proxy (a
    Firebase Function needs the paid Blaze plan). In iteration 0 the planner
    files a decision issue. The design does not depend on the answer.

## Decisions made while drafting

| Decision | Choice | Where |
|---|---|---|
| Approval model | The owner approves promotions and `risk:high` PRs; the verifier approves the rest | §2, Alternative L |
| Promotion merges | Merge commits | §6 |
| semantic-release | Inside the deploy workflow, with no version commit | §6, Alternatives D–E |
| Design "done" | Token lint at 0, approved baselines, no rubric score of 1 | §7 |
| Token naming | Keep `--wavely-spacing-*`, add `--wavely-type-*` | §8 |
| Upgrade blockers | A step waits until its packages are stable | §9 |
| Capacitor | Removed as upgrade step 0 | §9, Alternative K |
| Stored preferences | No schema version; each service handles its own key | §10 |
| SDD.md | Archived to `docs/archive/SDD-v1.9.md` | §5 |
| Other harnesses | The Nx skills and `opencode.json` stay untouched | §3 |
| Deploy auth | A service-account JSON key | §6, Alternative O |
| Cost metric source | `ccusage`, pinned, instead of a custom session-log parser; per-issue cost only for worktree sessions | §11 |
| Skills at the start | All seven skills are created in iteration 0, issue 2. A skill skips any step whose target does not exist yet | §3, items 12–18 |

## Critical User Journeys (CUJs)

### CUJ 1: Idea to planned issue

*   **Given**: The owner has an idea or has found a bug while using the app.
*   **When**: The owner describes it to the main Claude Code session.
*   **Then**: The planner files or updates a GitHub issue. The issue meets the
    Definition of Ready in `docs/team.md`. For a bug, this happens before any
    fix is written.

### CUJ 2: Issue to merged PR with evidence

*   **Given**: An issue in the current iteration meets the Definition of Ready.
*   **When**: The engineer picks it up.
*   **Then**:
    *   The engineer works on `fix/<n>-…` or `feature/<n>-…` off `dev`, with
        tests.
    *   The `wavely-validate` skill passes locally.
    *   The engineer updates the EGM.md of every directory it touched, or says
        why not.
    *   The engineer opens a PR from the template.
    *   CI passes on the PR, including mobile E2E, and the preview channel
        deploys for a signed-out check.
    *   The verifier checks the acceptance criteria against the evidence and
        approves or sends the PR back.
    *   Every send-back is labelled, so it counts toward the rework rate.

### CUJ 3: Design change verified

*   **Given**: A screen changes, with or without a Claude Design mockup.
*   **When**: The PR is opened.
*   **Then**:
    *   The token lint reports no raw values.
    *   The screenshot diff against the approved baseline is either within
        tolerance or explained in the PR's design-verdict section.
    *   The verifier scores the screen against a fixed design rubric.
    *   A new or intentionally changed baseline is approved by the owner.
    *   After two failed design rounds, the issue goes to the owner.

### CUJ 4: Iteration released to production

*   **Given**: All issues in the iteration are merged to `dev`.
*   **When**: The planner closes the iteration.
*   **Then**:
    *   A `dev` → `main` PR passes its checks and is merged.
    *   semantic-release tags the version and the production deploy runs.
    *   The owner's installed PWA picks up the new version within two
        launches. The version shown in Settings then equals the release tag.
    *   `docs/iterations/NN.md` records the shipped issues and the factory
        metrics.

### CUJ 5: A dependency step goes wrong

*   **Given**: One step of the upgrade sequence, for example Angular 22, has
    been released.
*   **When**: A regression appears in production.
*   **Then**:
    *   Reverting that step's squash commit on a `hotfix/*` branch off `main`
        releases a version without the step. `main` is then merged back into
        `dev`.
    *   This restores the previous code and Hosting. It does not undo data the
        faulty release wrote to Firestore.
    *   A rollback runbook covers hosting, Firestore rules and the PWA cache.

## Technical Plan (Architecture)

### 1. How the pieces fit together

```text
 Owner (also the only user)
   │  ideas, bugs, approvals (promotions and risk:high PRs)
   ▼
 Main Claude Code session = front door
   │  routes work; it is the only thread that starts subagents
   ├──► planner   ── skills: wavely-intake, wavely-iteration
   ├──► engineer  ── skills: wavely-validate, wavely-docs-sync
   └──► verifier  ── skills: wavely-validate, wavely-design-check,
                              wavely-security-audit, wavely-release
          │
          ▼  every handoff is a file or a check
 GitHub: issue (Ready) → PR (template + evidence) → CI → preview channel
          │
          ▼
 feature/* or fix/* ──squash──► dev ──merge commit (owner approves)──► main
                                                                         │
                     semantic-release: version + tag + GitHub release ◄──┘
                                                                         │
                          build with that version → Firebase Hosting + rules
                                                                         │
                          scripts/factory-metrics.mjs → docs/iterations/NN.md
```

The main session orchestrates because a Claude Code subagent cannot start
other subagents. The three roles are subagents that the main session starts
with a written brief. Skills hold the procedures, so a role file stays short
and holds no versions, routes or CI tables.

### 2. The team

Each role file in `.claude/agents/` has four headings: **Mandate**, **Reads
first**, **Produces**, **May not**.

| Role | Mandate | Produces | May not |
|------|---------|----------|---------|
| `wavely-planner` | Triage, backlog, iteration planning and closing, acceptance criteria | Issues that meet the Definition of Ready, iteration milestones, `docs/iterations/NN.md` | Write app code or merge PRs |
| `wavely-engineer` | Implement one issue at a time, with tests and doc updates | A branch, a PR from the template, updated EGM.md files | Merge its own PR; approve; change CI, release or Firestore rules unless the issue is labelled `risk:high` |
| `wavely-verifier` | Check a PR against its acceptance criteria and the gates; check releases | A verdict comment with evidence, the `verified` or `rework` label, release checks | Write feature code; merge `risk:high` or promotion PRs without the owner's go-ahead |

**Approval model.**

*   The verifier approves ordinary PRs into `dev` by adding the `verified`
    label and a verdict comment. The main session may then merge them.
*   The owner approves every `dev` → `main` promotion PR and every PR labelled
    `risk:high`. That covers dependency majors, CI and release workflows,
    Firestore rules, auth, and screenshot baseline changes.
*   A required CI check, `risk-gate`, fails a PR unless it carries `risk:high`
    when it changes any of these: `.github/workflows/**`, `firestore.rules`,
    `firebase.json`, `.releaserc*`, the screenshot baselines, `package.json`,
    `bun.lock`, `project.json`, `jest.config.cts`, `.stylelintrc.json`,
    `.claude/settings.json` or `scripts/**`. Any dependency change counts,
    not only a major version: almost every dependency change in this program
    is an upgrade step that is `risk:high` anyway, and a path rule needs no
    version parsing. The cost is that a feature which adds a library also
    needs the owner's approval. The label is then not left to the agent's
    judgement, and rules changes during upgrade iterations are caught.

**Known weakness: GitHub cannot tell who approved.** Agents run under the
owner's own GitHub account (`gh` is logged in as `bndF1`). As a result:

*   GitHub cannot tell an agent's approval from the owner's.
*   GitHub reviews cannot record approval, because an account cannot approve
    its own PR.

So the approval model is a written rule in AGENTS.md. A required CI check,
`verified-gate`, fails a PR to `dev` until it carries the `verified` label.
This records that a verdict exists. It does not prove who gave it, because any
session on the account can add the label. Promotion PRs rely on the owner's
approval alone; no check walks the PRs a promotion includes. A separate GitHub
App or machine account for the agents would make approvals enforceable. That
is listed under Future Improvements.

### 3. Skills

All skills live in `.claude/skills/<name>/SKILL.md`. Each one is a procedure.
Rules and policy stay in AGENTS.md and `docs/team.md`.

| Skill | What it does | Output |
|-------|--------------|--------|
| `wavely-intake` | Turns an idea or bug into an issue that meets the Definition of Ready in `docs/team.md` | A GitHub issue |
| `wavely-iteration` | **plan:** choose about 4 Ready issues by the composition rule (security first, then 1–2 bugs, 1–2 features) and put them in the "Iteration NN" milestone. **close:** open the promotion PR, run `scripts/factory-metrics.mjs`, write `docs/iterations/NN.md` | A milestone; an iteration record |
| `wavely-validate` | Runs locally the CI checks except the visual comparison: lint, token lint, typecheck, unit tests, build, and functional E2E for the affected area. Reports pass or fail per step, and states which checks it left to CI | A pass/fail table pasted into the PR |
| `wavely-design-check` | Runs the token lint and the visual E2E project, collects the screenshot diffs, and scores the screen against `docs/design/rubric.md` | A verdict with scores and diff images (CI artifacts) |
| `wavely-security-audit` | Runs `bun audit`, scans the diff for secrets, and checks Firestore rules changes and new external hosts | Findings filed as issues with `security` |
| `wavely-release` | Checks that the promotion PR passed, waits for semantic-release and the deploy, smoke-tests the signed-out routes in production (login, podcast detail, publisher), reads the deployed version from `ngsw.json`, and records the owner's PWA-update check | The release tag; a smoke-test result |
| `wavely-docs-sync` | For every directory a PR touched, updates its EGM.md, or records why no update is needed. Also updates AGENTS.md and `docs/` when a rule changes | Doc changes in the same PR |

**Removed:**

*   `.github/skills/wavely-{orchestrator,qa,design,security,git-flow}`. Their
    useful content (security rules, QA checklists) moves into the skills above
    and into AGENTS.md.
*   The Stitch skills in `.agents/skills/` and `skills-lock.json`. Both are
    untracked, so removing them is a local cleanup.

**Kept as they are:** the Nx-generated skills in `.github/skills/nx-*`,
`monitor-ci`, and `opencode.json`. Nx manages them, and the Nx block at the top of AGENTS.md points
to them.

### 4. Handoff files and labels

*   **Issue templates** (`.github/ISSUE_TEMPLATE/bug.yml`, `feature.yml`, plus a
    new `chore.yml`) get the Definition of Ready fields: acceptance criteria,
    size, and risk.
*   **PR template** (new, `.github/pull_request_template.md`) has these
    sections:
    *   `Closes #N`
    *   what changed
    *   the `wavely-validate` table
    *   design verdict (when the PR touches UI)
    *   docs/EGM updated, or the reason why not
    *   risk
*   **Labels.** The existing `bug`, `feature`, `chore`, `security` and
    `priority: high/medium/low` labels stay. New labels:
    *   `size:S`, `size:M`, `size:L`
    *   `risk:high`
    *   `verified`
    *   `rework`
    *   `status:needs-owner`
*   **Milestones.** One per iteration, named "Iteration NN".
*   **Iteration records.** `docs/iterations/NN.md` lists the issues shipped,
    the release tag, the metrics and a short retrospective.

### 5. Where facts live

| Fact | Home |
|------|------|
| Rules, policy, security rules, git flow, approval model | `AGENTS.md`, loaded by Claude Code through a new `CLAUDE.md` that imports it |
| Roster, routing, Definitions of Ready and Done, iteration rules, metric formulas | `docs/team.md` |
| Code contracts | EGM tree (`EGM.md` per directory) |
| Token spec, design rubric, mockup index | `docs/design/README.md`, `docs/design/rubric.md`, `docs/design/mockups/` |
| Rollback steps | `docs/runbooks/rollback.md` |
| Versions | `package.json` |
| Backlog and iterations | GitHub issues and milestones |
| Old system design | `docs/archive/SDD-v1.9.md` (SDD.md moved there, read-only) |

The roadmap table and milestone list at the end of AGENTS.md are removed,
because GitHub holds that information.

The GitHub Pages landing site moves from `docs/` to `landing/`, because
`pages.yml` publishes all of `docs/`.

### 6. Branches, CI and release

**Branch flow.** `feature/*`, `fix/*`, `chore/*` and `docs/*` branch from
`dev`. Merges into `dev` are squash merges, and the squash title must be a
Conventional Commit. A required CI check lints the PR title as a Conventional
Commit, because the squash title becomes the commit that semantic-release
reads. Promotion from `dev` to `main` is a **merge commit**. That
keeps the two branches on the same history and lets semantic-release read every
commit. A hotfix branches from `main`, merges to `main`, and then `main` is
merged back into `dev`. The `staging` branch and
`firebase-hosting-staging.yml` are deleted.

**Hotfix and back-merge.** A hotfix PR into `main` is squashed, with a `fix:`
or `revert:` title. The back-merge PR from `main` into `dev` uses a merge
commit (not a squash), so both branches keep the same history, and
`verified-gate` skips it.

**Checks.**

| Trigger | Checks |
|---------|--------|
| PR to `dev` | PR-title lint, lint, token lint, typecheck, unit tests, build, functional E2E (desktop and mobile viewports, with fixed test data), visual comparison (in the pinned Playwright container), preview-channel deploy, `risk-gate`, `verified-gate` |
| PR to `main` (promotion) | the same, plus owner approval (the written rule) |
| Push to `main` | semantic-release, then a build with the new version, then deploy Hosting and Firestore rules, then Lighthouse as a report |

**semantic-release.** It runs inside the production workflow
(`firebase-hosting.yml`), not in a separate one. A tag pushed with the default
`GITHUB_TOKEN` does not start another workflow, so a separate release workflow
would never trigger the deploy. It uses three plugins:

*   commit analysis, with `releaseRules` entries that make `chore(deps)` and
    `build(deps)` a patch release, so each upgrade step changes the version,
    and that make a `revert:` commit a patch release, because a squashed
    revert has no "This reverts commit" body for the default rule to find;
*   release notes;
*   GitHub release.

It does **not** commit a version bump back to `main`. That would need a
back-merge to `dev` after every release. The app already reads its version
from the latest git tag (`scripts/generate-env.mjs`). The `package.json`
version is frozen at `0.0.0-managed-by-semantic-release`, and the
`version-bump-check` job is removed from `ci.yml`. The production workflow
checks out full history (`fetch-depth: 0`), because semantic-release and
`generate-env.mjs` read tags.

**CI fixes.**

*   The cache key hashes `bun.lock`.
*   Every workflow pins the same bun version.
*   Deploys authenticate with a service-account JSON key stored in a **new**
    secret, `FIREBASE_SERVICE_ACCOUNT_WAVELY`, instead of `FIREBASE_TOKEN`.
    AGENTS.md already names this secret, but it does not exist yet: the only
    Firebase credential in the repo secrets today is `FIREBASE_TOKEN`. The
    owner creates the service account and the secret.
*   `scripts/firebase-add-auth-domain.mjs` is deleted:
    `hosting:channel:deploy` already authorizes channel domains. The CLI only
    logs a warning when that fails, so the deploy step fails the run when its
    log reports an authorized-domain error. The `FIREBASE_TOKEN` secret is
    deleted only after a deploy with the new key has succeeded.

### 7. Design verification

*   **Token lint.** Stylelint with a rule that rejects raw `px`, `rem`, hex and
    `rgb()`/`rgba()` values for `padding*`, `margin*`, `gap`, `font-size`,
    `line-height`, `color`, `background*` and `box-shadow` in
    `src/app/**/*.scss`. Only `src/styles.scss` may define them. At
    first the rule only warns, and CI records the count. It becomes an error
    once the count reaches 0.
*   **Visual E2E.** Two Playwright projects, `visual-mobile` and
    `visual-desktop`:
    *   mobile: 390×844, touch enabled;
    *   desktop: 1024×768, the width where #365 occurs.

    Network calls to iTunes, Radio Browser, RSS feeds and `corsproxy.io` are
    answered from files in `e2e/fixtures/` through `page.route`, so the data
    never changes. Animations are disabled. Each page has one
    `toHaveScreenshot` check per viewport, with a tolerance of 1% of pixels
    (`maxDiffPixelRatio: 0.01`).
*   **Baselines.** Baselines are made and compared in the same pinned
    Playwright container image, and `@playwright/test` is pinned to that
    image's exact version, so fonts render the same each run. A manual workflow
    (`visual-baselines.yml`, run from a branch) regenerates them and uploads
    them as a run artifact. The owner downloads and commits them
    (`gh run download`), and that push triggers CI as normal. Any PR that
    changes a baseline is `risk:high`, so the owner approves it. That approval
    is the owner's sign-off on how a page looks, given again each time the
    baseline changes.
*   **Rubric.** `docs/design/rubric.md` scores hierarchy, spacing, density
    (list rows visible on a 390×844 screen), type, restraint (no decorative
    blur, gradients or shadows beyond Ionic's defaults), and accessibility
    (contrast, tap targets) from 1 to 3. A screen passes when no score is 1. After two
    failed rounds, the issue gets `status:needs-owner`.
*   **Mockups.** Claude Design exports are saved as
    `docs/design/mockups/<page>/<viewport>.png` and listed in
    `docs/design/README.md`. A mockup guides the first build of a new or changed
    screen. After that, the approved baseline is the contract.

### 8. Design tokens (Part D)

*   Keep the existing `--wavely-spacing-xs` to `2xl` names to avoid churn. Add
    type tokens: `--wavely-type-{caption,body,body-strong,title,headline}-{size,line-height,weight}`.
*   Map the tokens onto Ionic's variables in one block of `src/styles.scss`. An
    Ionic 9 restyle is then intended to change only that block.
*   Merge the `!important` breakpoint overrides and the duplicated dark-mode
    blocks in `src/styles.scss` into the token layer.
*   Adoption is one issue per group of pages, for example Home and Discover, or
    Library and Settings. Each one brings the token-lint count for those files
    to 0 and updates their baselines with the owner's approval.

### 9. Dependency upgrade (Part C)

Each step is one PR, labelled `risk:high`, so reverting one PR undoes one
step. Steps planned in the same iteration ship in that iteration's one
release. Before each step, the engineer writes a
compatibility table from each package's `peerDependencies` on that day. If a
required package has no stable release yet, the step waits and the next
independent step goes first.

| Step | Change | Depends on (provisional; re-checked from `peerDependencies` when the step starts) |
|------|--------|------------|
| 0 | Remove Capacitor: `android/`, `ios/`, `capacitor.config.ts`, the `@capacitor/*` packages, the `cap:*` scripts and their EGM files | — |
| 1 | Minor and patch updates inside the current majors | 0 |
| 2 | Nx 22 → 23, using `nx migrate` | 1 |
| 3 | Nx 23 → 24 | 2 |
| 4 | Sentry 10 → 11, ngx-translate 17 → 18 | 1 |
| 5 | Angular 22, NgRx Signals 22, angular-eslint, `jest-preset-angular`, `@testing-library/angular` | 3, 4 |
| 6 | Firebase 13 and `@angular/fire` 21, once `@angular/fire` 21 is stable and allows Angular 22 | 5 |
| 7 | Ionic 9, checked against the screenshot baselines | 5 and the baselines from iteration 0 |
| 8 | TypeScript next major, only if Angular officially supports it | 5 |

The baselines have to exist before step 7. That is why iteration 0 creates them
for the current pages.

A step that changes rendering (the Playwright and Chromium bump in step 1,
step 5, step 7) is one PR that holds the version change and the baselines
regenerated by `visual-baselines.yml`, with no page or token edits. The owner
reviews the diff images before approving. Token groups start only after step 7
has merged, so an Ionic regression is never approved together with an
intended design change.

### 10. PWA updates and data safety

*   **App updates.** A new `AppUpdateService` in `src/app/core/services/`
    listens to `SwUpdate.versionUpdates`. When a new version is ready, it
    activates it and reloads the next time the app is opened or comes back to
    the foreground, never in the middle of playback.
*   **Caching.** `firebase.json` serves `ngsw-worker.js`, `ngsw.json` and
    `index.html` with `Cache-Control: no-cache`. Other files matched by the
    existing extension rule keep their one-year cache.
*   **Stored preferences.** No schema version is added. Each service that owns
    a localStorage key keeps handling unreadable values itself, as
    `UserPreferencesService` and `SearchHistoryService` do today. A versioned
    migration is designed only when a stored shape changes. It must then leave
    an unknown newer version untouched, so that a rolled-back build still
    starts.
*   **Firestore.** All environments share one database, so:
    *   changes during upgrade iterations are additive only (new fields or
        collections, never renamed or removed ones);
    *   rules deploy only from `main`.

    `docs/runbooks/rollback.md` covers four things:
    *   rolling back Hosting to the previous release;
    *   redeploying rules from the previous tag;
    *   forcing the PWA to update;
    *   checking that sign-in still works.

### 11. Factory metrics

`scripts/factory-metrics.mjs <iteration>` reads GitHub, and the local session
logs through `ccusage` (an existing open-source usage reporter, so the plan
writes no log parser and keeps no price table), and prints the numbers that `wavely-iteration close` writes into
`docs/iterations/NN.md`. Its inputs are recorded events. Agents apply the two
labels it counts (`rework` and `status:needs-owner`), so those two metrics
depend on agents following the labelling rules in `docs/team.md`.

| Metric | Formula | Source |
|--------|---------|--------|
| Rework rate | shipped issues whose linked PR (via `Closes #N`) had a `rework` label event, or that were reopened ÷ issues shipped | GitHub PR label events and issue events |
| Review rounds | median number of `rework` label events per PR | GitHub PR events |
| Cost per issue | **Average:** total cost of this repo's sessions in the iteration window ÷ issues shipped. **Per issue:** the cost of sessions whose project path is a worktree named `<n>-…`. Everything else (the main session, planning, verification outside a worktree) is one "Shared" row. Shown as tokens and as `ccusage`'s estimated cost | `ccusage claude session --json --offline --since <YYYYMMDD> --until <YYYYMMDD>`, one row per session with `projectPath`, `firstActivity`, `lastActivity`, token counts and `totalCost`. Verified on 2026-11-13 with `ccusage` 20.0.50. `ccusage` has no git-branch field, so per-issue attribution depends on the worktree name. Session logs must be kept longer than one iteration (`cleanupPeriodDays` of at least 60) |
| Owner interventions | `status:needs-owner` label events in the iteration. Required approvals are not counted | GitHub label events |
| Cycle time | median time from an issue entering the iteration to its PR merging | GitHub |

Agents and the owner share one GitHub account, so owner comments cannot be told
apart from agent comments. That is why interventions are counted only through
the label.

### 12. Iteration 0 (Parts A and B)

Iteration 0 is larger than the usual 4 issues (5 issues), because it
builds the factory. A backlog-cleanup session by the planner runs **before**
iteration 0 starts. It is not an iteration issue, so its cost and cycle time
do not distort the iteration's metrics.

**Before iteration 0: backlog cleanup** (one planner session, not counted):

*   close #366–#378 and #41–#48, each with a one-line reason;
*   check #279 against this design, then close it when semantic-release ships;
*   triage #257, #289, #294, #365 and #381–#386 into Iterations 01–05.

Iteration 0 itself is planned as these issues, in this order:

1.  **Security:**
    *   revoke the Stitch key and remove the server from `.mcp.json`;
    *   file and fix drift item 7 (no empty-user check in `loadFromFirestore`);
    *   deny unused collections in `firestore.rules` (`risk:high`).
2.  **Factory files** (`risk:high`, because it moves `pages.yml`):
    *   `CLAUDE.md`, `docs/team.md`, the three agent files and the seven skills;
    *   `scripts/factory-metrics.mjs`;
    *   the PR template, the issue-template changes and the labels;
    *   remove the old Copilot and Stitch skills;
    *   rewrite the agent section of AGENTS.md;
    *   archive SDD.md.
3.  **Release pipeline** (`risk:high`):
    *   semantic-release;
    *   remove `version-bump-check`, `staging` and `firebase-hosting-staging.yml`;
    *   rewire Lighthouse;
    *   the CI fixes;
    *   switch to service-account authentication.
4.  **Checks** (`risk:high`, because it creates baselines):
    *   the visual Playwright project with fixtures;
    *   E2E on PRs to `dev`;
    *   the token lint in warning mode;
    *   the first baselines for the current pages.
5.  **PWA safety** (`risk:high`, because it edits `firebase.json`):
    `AppUpdateService`, the cache headers, and the rollback runbook.

### 13. Planned iterations after 0

| Iteration | Planned content (about 4 issues; the planner may adjust) |
|-----------|----------------------------------------------------------|
| 1 | Upgrade steps 0–1, #381 (Discover search), #382 (Radio search) |
| 2 | Upgrade steps 2–4, #383 (Publisher) |
| 3 | Upgrade step 5 (Angular 22), #386 (Home load-more), #384 and #385 if not already done |
| 4 | Upgrade steps 6–7 (Firebase, Ionic 9), then token groups start (#289, #294) once step 7 has merged |
| 5+ | Remaining token groups, #365, step 8 if supported, then features (#257 and others) |

## Alternatives Considered

### Alternative A: A five-role team modelled on the owner's other projects (or more)

*   **Pros**: Each concern gets a named owner: product, architecture, design,
    QA and release, security. This matches the owner's other projects, so the
    files could be copied across with small changes.
*   **Cons**:
    *   Wavely has one user and no business side.
    *   A triager and a product lead overlap with each other and with the main
        session, which already acts as the front door.
    *   A subagent cannot start other subagents, so a "chief of staff" subagent
        cannot dispatch work.
    *   More roles means more handoffs without more checks.
*   **Reason for Rejection**: Rejected: three roles (planner, engineer,
    verifier) with checks written as skills cover the same concerns with fewer
    handoffs. A role is added only when a logged failure shows one is needed.

### Alternative B: Keep the `staging` branch

*   **Pros**: An extra environment where a release can be tried before
    production. It is already wired up (`firebase-hosting-staging.yml`, the
    staging channel, Lighthouse after the staging deploy).
*   **Cons**:
    *   Every release needs two promotion PRs.
    *   Squash merges to `staging` force back-merges (SDD.md documents a manual
        reconcile step, and #379 is one of these).
    *   The staging channel uses the same Firestore database as production, so
        it does not isolate data anyway.
    *   Per-PR preview channels already give a live build to test.
*   **Reason for Rejection**: Rejected: preview channels plus E2E on PRs to
    `dev` give a live build per change at half the promotion cost, and staging
    does not isolate data.

### Alternative C: A documented manual version bump

*   **Pros**: No new tooling. It works the same way as today's
    `version-bump-check`.
*   **Cons**: Someone must remember to bump the version on every promotion,
    and CI blocks the PR until they do. That stalls "release every iteration",
    and AGENTS.md and SDD.md already describe automatic versioning that does
    not exist.
*   **Reason for Rejection**: Rejected: a manual bump blocks every promotion
    until someone acts. semantic-release derives the version from Conventional
    Commits with no human step.

### Alternative D: A version-bump commit back to `main` (`@semantic-release/git`)

*   **Pros**: `package.json` always shows the released version, and a
    CHANGELOG.md file stays in the repo.
*   **Cons**: Every release adds a commit to `main` that `dev` does not have,
    so `main` must be merged back into `dev` after each release. The app
    already reads its version from the git tag, so the commit adds nothing the
    running app uses.
*   **Reason for Rejection**: Rejected: a back-merge after every release costs
    more than a version number the running app does not read. Release notes
    live in GitHub Releases.

### Alternative E: A separate release workflow that triggers the deploy on tag push

*   **Pros**: Releasing and deploying are separate jobs, each with its own log.
*   **Cons**: A tag pushed with the default `GITHUB_TOKEN` does not start other
    workflows. The deploy would never run unless a personal access token
    (another secret to manage) or a `workflow_run` chain were added.
*   **Reason for Rejection**: Rejected: avoiding a personal access token or a
    `workflow_run` chain outweighs having separate jobs. semantic-release runs
    as the first step of the production deploy workflow.

### Alternative F: The designer agent compares mockups with screenshots as the only "done" check

*   **Pros**: Simple to describe, and it matches the original idea of the
    designer agent deciding "done".
*   **Cons**:
    *   The verdict cannot be reproduced.
    *   Reviewing images adds image tokens on every loop.
    *   Ionic does not render a mockup pixel for pixel.
    *   Live iTunes and RSS data change the screenshots between runs.
    *   SDD.md already describes this exact flow for the abandoned Stitch
        direction.
*   **Reason for Rejection**: Rejected as the only check. It is kept as the
    subjective layer (a fixed rubric), on top of the token lint and
    owner-approved screenshot baselines.

### Alternative G: A paid visual-review service (for example Chromatic or Percy)

*   **Pros**: A hosted diff viewer, stable rendering, and an approval flow
    built in.
*   **Cons**: Another paid account and another secret. The diff viewer adds
    little for one person who already reviews PRs on GitHub.
*   **Reason for Rejection**: Rejected: for a single reviewer, the hosted
    viewer adds a paid account and a secret but little review value.
    Playwright's built-in `toHaveScreenshot`, with baselines from a pinned
    container, covers one reviewer's needs.

### Alternative H: Upgrade every dependency in one iteration

*   **Pros**: One disruption instead of several. The app reaches current
    versions sooner.
*   **Cons**:
    *   The nine dependencies depend on each other: Nx must step through 23, and
        Sentry 11 must come before Angular 22.
    *   One large PR cannot be reverted in part.
    *   A regression cannot be traced to one package.
    *   It would also break the 4-issue iteration size.
*   **Reason for Rejection**: Rejected: an ordered sequence of small
    `risk:high` PRs over iterations 1–4 keeps each change revertible on its
    own and traceable to one package.

### Alternative I: A fixed security slot in every iteration

*   **Pros**: Security work is guaranteed time.
*   **Cons**: Vulnerabilities do not arrive on a schedule. An empty slot
    either goes unused or gets low-value work.
*   **Reason for Rejection**: Rejected: a fixed slot leaves capacity unused
    when no security work exists. Security work goes first whenever it exists.
    Otherwise the slot goes to a bug or chore.

### Alternative J: Keep the Stitch design direction (milestone #11)

*   **Pros**: Twelve issues are already written, with a full plan for fonts,
    colours and every page.
*   **Cons**: It changes fonts, colours and every page at once. That conflicts
    with the token-first approach (Part D) and would replace every baseline in
    one step.
*   **Reason for Rejection**: Rejected: existing screens are brought in line
    through tokens and baselines, not a full redesign.

### Alternative K: Keep the Capacitor shells, frozen and outside the upgrade

*   **Pros**: A native build stays one `cap sync` away.
*   **Cons**: Two native projects that nobody builds would break without anyone
    noticing. A
    later `cap sync` against Angular 22 may not build. The packages also add to
    the upgrade surface.
*   **Reason for Rejection**: Rejected: removing the shells (upgrade step 0)
    shrinks the upgrade surface, and git history keeps them if native work
    returns.

### Alternative L: Other approval models

*   **Pros**: Model B (the verifier approves everything, including promotion)
    gives agents the most autonomy and the owner the least work. Model C (the
    owner approves every merge) puts the owner's check on every change.
*   **Cons**: Under B, a behaviour change that no test catches reaches
    production with no human check. Under C, the owner has to approve every
    merge. Every merge then needs an approval the intervention metric does not
    count, so the metric no longer shows how often agents needed help.
*   **Reason for Rejection**: Rejected: model A puts the owner's check on
    promotions and `risk:high` PRs, where an uncaught change costs most, and
    leaves ordinary PRs to the verifier.

### Alternative M: Separate Firebase projects for dev and production

*   **Pros**: A broken build on `dev` could not write production data.
    Firestore rules could be tested before release.
*   **Cons**: A second project to configure, separate auth domains, and a
    second set of secrets and quotas.
*   **Reason for Rejection**: Rejected for now: one project keeps one auth
    setup and one set of secrets. The remaining data risk is stated under
    Non-Goals and in Risks & Mitigations.

### Alternative N: A narrower design document

*   **Pros**: A factory-only, or factory-plus-iteration-0, document is shorter,
    and every file it lists is known today.
*   **Cons**: The upgrade order, the baseline dependency (step 7 needs
    iteration 0's baselines) and the token rollout would be reviewed in
    separate documents, so the dependencies between them would not be checked
    together.
*   **Reason for Rejection**: Rejected: one document keeps those dependencies
    reviewable together. Upgrade steps that depend on package releases are
    re-checked on the day each step starts.

### Alternative O: Keyless deploy auth (GitHub OIDC with Workload Identity Federation)

*   **Pros**: No long-lived key exists to leak. Tokens last one job.
*   **Cons**: It needs a workload identity pool and provider in Google Cloud,
    `google-github-actions/auth` in every deploy workflow. That is more setup than one key for a
    one-person project.
*   **Reason for Rejection**: Rejected for now: a key with a narrow role set is
    less setup. Moving to WIF is listed under Future Improvements.

--------------------------------------------------------------------------------

## Non-Functional Requirements

*   **Security and privacy.**
    *   No secret values in any committed file, agent file or skill.
    *   The Stitch key is revoked, not just deleted.
    *   The new service-account key has only the roles a dry-run deploy shows
        are needed: Firebase Hosting Admin, Firebase Rules Admin, Firebase
        Authentication Admin (the channel deploy uses it to authorize preview
        domains), and Service Usage Consumer. It lives
        only in the GitHub secret.
    *   `wavely-security-audit` scans every diff for secrets.
    *   The session logs that `scripts/factory-metrics.mjs` reads stay on the
        owner's machine. The script outputs only token counts, never message
        content.
*   **Cost.**
    *   Agents read EGM.md files and skills rather than whole directories.
    *   The verifier reviews screenshots only when the diff fails or the PR
        touches UI.
    *   Design rework stops after two rounds.
    *   Cost per issue is recorded every iteration, so cost changes are visible.
*   **Rollout and rollback.**
    *   Every upgrade step is one PR that can be reverted on its own.
    *   Firestore changes stay additive while all environments share one
        database.
    *   `docs/runbooks/rollback.md` covers Hosting, rules, the PWA cache and
        sign-in.
    *   The PWA update service reloads only when no audio is playing.

## Risks & Mitigations

| Risk | Impact | Mitigation | Status |
|---|---|---|---|
| Agents skip the owner-approval rule, because they share the owner's GitHub account | A change reaches `main` without the owner's check | Written rule in AGENTS.md; `risk-gate` and `verified-gate` checks; a GitHub App later | Reduced, not closed |
| A preview or `dev` build writes bad data to the shared Firestore database | Real data is overwritten or deleted | Additive changes only; rules deploy only from `main`; sign-in checks only on the `dev` channel; separate projects later | Open |
| The service-account key leaks | Someone can deploy Hosting and rules | Only the roles a dry-run needs; key only in the GitHub secret; WIF later | Reduced |
| semantic-release tags, but the deploy then fails | A public release exists for a version that is not live | Re-run the same workflow run, since the tag already exists; `wavely-release` compares the tag with the deployed version | Accepted |
| A squash title is not a Conventional Commit | The release is skipped or under-bumped | Required PR-title lint | Closed |
| An intended baseline change hides a real regression | A visual bug ships | A rendering-change PR holds only the version bump and the regenerated baselines, with no page or token edits; the owner reviews the diff images | Reduced |
| The Claude Code session-log format or retention changes | The cost metric is wrong without anyone noticing | `ccusage` tracks log-format changes upstream and is pinned to an exact version; the metrics script fails when an iteration has no session for this repo; retention setting documented | Reduced |
| `corsproxy.io` goes down or alters responses | RSS feeds fail or are tampered with | Decision issue in iteration 0; first-party proxy under Future Improvements | Open |

## Future Improvements

*   **A separate GitHub identity for agents** (a GitHub App or machine
    account), so GitHub can enforce the approval model with real reviews and
    branch protection.
*   **Separate Firebase projects** for dev and production, to isolate data and
    test Firestore rules before release.
*   **Keyless deploy auth** (Workload Identity Federation) in place of the
    service-account key.
*   **Observability:**
    *   a Sentry environment for preview builds;
    *   release tags with source maps;
    *   a breadcrumb that distinguishes direct RSS fetches from proxy fetches.
*   **A first-party RSS proxy**, if the `corsproxy.io` decision issue chooses
    it.
*   **Sleep timer (#45) and chapters (#46)** as web features.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

The work is grouped by iteration and issue. Every file below is created,
modified, deleted or moved by the issue it is listed under. Upgrade steps
change files through tooling (`nx migrate`, Angular schematics). For those
steps, the list names the files the tooling is expected to touch, and the
verification plan confirms the result.

### Owner actions (manual, outside the repo)

These steps need the owner's Google Cloud, Firebase or GitHub access. Agents
cannot do them.

1.  **Revoke the Stitch API key** in Google Cloud Console → APIs & Services →
    Credentials. (Iteration 0, issue 1.)
2.  **Create the deploy service account.** In the Google Cloud project
    `wavely-f659c`, create `github-deploy` with the roles Firebase Hosting
    Admin, Firebase Rules Admin, Firebase Authentication Admin and Service
    Usage Consumer. Download a JSON key and save it as the GitHub secret
    `FIREBASE_SERVICE_ACCOUNT_WAVELY`. Delete the local key file afterwards.
    Run one dev deploy with the key and confirm that its log has no
    authorized-domain error. (Iteration 0, issue 3.)
3.  **Remove the old secret.** After the dev deploy and the first production
    deploy that use the service account succeed, delete the GitHub secret `FIREBASE_TOKEN` and revoke the
    CLI token (`firebase logout --token`). (Iteration 0, issue 3.)
4.  **Repository settings.** Branch protection matches checks by job name, so
    the names below must match the `name:` of each job exactly.
    *   Allow merge commits and squash merges. (Issue 3.)
    *   Set the default squash commit message to "Pull request title".
        (Issue 3.)
    *   Protect `dev` and `main`: PR required. After issue 3's PR merges, add
        the required checks `ci`, `pr-title`, `risk-gate` and
        `verified-gate`. After issue 4's PR merges, add `e2e (functional)`
        and `e2e (visual)`.
    *   After issue 3's PR merges, delete the `staging` branch and the
        `staging` Hosting channel (`firebase hosting:channel:delete staging`).
    *   Under Settings → Pages, keep "GitHub Actions" as the source.
        (Issue 2.)

### Before iteration 0: Backlog cleanup (planner session, not an iteration issue, no file changes)

The planner closes #366–#378 ("Stitch direction dropped, see
docs/designs/wavely-ai-factory.md") and #41–#48 ("web-only personal app;
native is out of scope"). #45 and #46 get a note that they may come back as web
features. The planner also:

*   creates the labels from Technical Plan §4;
*   creates milestones "Iteration 00" to "Iteration 05";
*   assigns #381 and #382 to 01; #383 to 02; #384, #385 and #386 to 03; #289
    and #294 to 04; #257 and #365 to 05;
*   checks #279 against this design and closes it when issue 3 ships;
*   files the `corsproxy.io` decision issue into Iteration 00;
*   closes milestones #4, #5 and #11.

### Iteration 0, issue 1: Security cleanup

#### 1. `.mcp.json` (Delete, local only, gitignored)

*   **Type / Scope**: Local MCP configuration.
*   **Proposed Changes**: Its only server is `stitch`, so delete the file.

#### 2. `.claude/settings.local.json` (Modify, local only)

*   **Type / Scope**: Local Claude Code settings.
*   **Proposed Changes**: Remove the disabled `stitch` server entry. The file
    has no Stitch permissions.

#### 3. `src/app/core/services/subscription-sync.service.ts` (Modify)

*   **Type / Scope**: TypeScript service.
*   **Proposed Changes**: `loadFromFirestore(uid, isStillCurrentUser)` returns
    early when `uid` is empty, before calling `collection()`. This is drift
    report item 7. The planner files the issue before the fix is written.

#### 4. `src/app/core/services/radio-favorites-sync.service.ts` (Modify)

*   **Type / Scope**: TypeScript service.
*   **Proposed Changes**: The same empty-`uid` guard in `loadFromFirestore`.

#### 5. `src/app/core/services/subscription-sync.service.spec.ts`, `radio-favorites-sync.service.spec.ts` (Modify)

*   **Type / Scope**: Unit tests.
*   **Proposed Changes**: A test that `loadFromFirestore('', () => true)`
    makes no Firestore call and returns without changing the store.

#### 6. `firestore.rules` (Modify, `risk:high`)

*   **Type / Scope**: Firestore security rules.
*   **Proposed Changes**:
    *   Delete the `users/{uid}/queue/{itemId}` and
        `users/{uid}/tokens/{tokenId}` blocks, so the existing
        `users/{uid}/{document=**}` deny rule covers them.
    *   Delete the `podcasts/{podcastId}` and `episodes/{episodeId}` blocks, so
        the final deny-everything rule covers them.

    No client code uses any of these four collections (checked by grep in the
    drift review).

#### 7. `src/app/core/services/EGM.md`, root `EGM.md` (Modify)

*   **Type / Scope**: Contracts.
*   **Proposed Changes**:
    *   Remove the note that `loadFromFirestore` has no `uid` check.
    *   Update the `firestore.rules` bullet in the root contract to list only
        the collections still in use: `subscriptions`, `progress`,
        `favoriteStations` and `history`.

### Iteration 0, issue 2: Factory files

Some skills below use files that later issues create: the token lint and the
coverage threshold (issue 4), the smoke spec (issue 4), the rubric (issue 4)
and the runbook (issue 5). Every skill skips a step whose target does not
exist yet and prints `skipped: <reason>` for it in its table.

#### 8. `CLAUDE.md` (Create)

*   **Type / Scope**: Claude Code entry point.
*   **Proposed Changes**: One import line, `@AGENTS.md`, plus one line pointing
    to `docs/team.md`. This makes Claude Code load AGENTS.md at session start.

#### 9. `AGENTS.md` (Modify)

*   **Type / Scope**: Repository rules.
*   **Proposed Changes**:
    *   Keep the Nx block and the security rules.
    *   In the secrets table, state that every deploy workflow uses
        `FIREBASE_SERVICE_ACCOUNT_WAVELY` (the table already names it, but no
        workflow uses it today).
    *   Remove references to deleted skills: `wavely-git-flow` (line 55) and
        `wavely-security` (line 108).
    *   Rewrite Git Workflow:
        *   the branch table becomes `feature/*|fix/*|chore/*|docs/*` → `dev` →
            `main`, with no `staging`;
        *   squash merges into `dev`, merge commits for promotion to `main`;
        *   CI gates per §6;
        *   semantic-release from Conventional Commits.
    *   Add the approval model from §2, the hotfix and back-merge rules from
        §6, and the written rule: the main session never
        merges a promotion or `risk:high` PR without the owner's go-ahead in
        chat.
    *   Update Bug Tracking to the real label names.
    *   Replace "Agent Ecosystem" with a short pointer to `docs/team.md`.
    *   Delete "Implementation Roadmap": GitHub milestones hold it.
    *   Remove the Lighthouse-gate claim.

#### 10. `docs/team.md` (Create)

*   **Type / Scope**: Team handbook.
*   **Proposed Changes**:
    *   **Roster:** the three roles, plus the main session as front door.
    *   **Routing:** which request goes to which role.
    *   **Definition of Ready** (the only copy; every other document links
        here): a problem statement, acceptance criteria, a type, a
        `priority: high/medium/low` label, a `size:*` label, `risk:high` when
        it applies, and either an "Iteration NN" milestone or no milestone
        (backlog).
    *   **Definition of Done:** validate passes, CI green, EGM updated or
        explained, verifier verdict, and owner approval when `risk:high`.
    *   **Iteration rules:** about 4 issues, security first, 1–2 bugs, 1–2
        features, an iteration ends with a release, hotfix path.
    *   **Approval model.**
    *   **Escalation triggers:** two design rework rounds, or two CI failures
        in a row on the same PR. `risk:high` approvals are not escalations and
        do not get `status:needs-owner`.
    *   **Labelling rules:** who applies `rework`, `verified` and
        `status:needs-owner`, and when.
    *   **Metric formulas** from §11. No price table: `ccusage` estimates
        cost.
    *   **Worktree rule:** the engineer works on issue `<n>` in a worktree
        named `<n>-<short-slug>` under `.claude/worktrees/`, so its cost can
        be attributed to the issue.

#### 11. `.claude/agents/wavely-planner.md`, `wavely-engineer.md`, `wavely-verifier.md` (Create)

*   **Type / Scope**: Claude Code subagent definitions.
*   **Proposed Changes**:
    *   Frontmatter: `name`, a `description` that tells the main session when
        to use the role, and `tools`.
        *   Planner: Read, Grep, Glob, Bash, Write, Edit. Its mandate limits
            writes to `docs/iterations/` and `docs/team.md`.
        *   Engineer: all tools.
        *   Verifier: Read, Grep, Glob, Bash.
    *   Body: Mandate, Reads first, Produces, May not, as in §2.
    *   No versions, routes or CI tables. Each file links to `docs/team.md` and
        names the skills it uses.

#### 12. `.claude/skills/wavely-intake/SKILL.md` (Create)

*   **Type / Scope**: Skill (procedure).
*   **Proposed Changes**: Steps to turn a request into a Ready issue with
    `gh issue create`, using the templates and the real label names. A bug is
    always filed before any fix.

#### 13. `.claude/skills/wavely-iteration/SKILL.md` (Create)

*   **Type / Scope**: Skill.
*   **Proposed Changes**:
    *   **`plan NN`:** pick Ready issues by the composition rule and assign
        the milestone.
    *   **`close NN`:**
        1.  Check that every issue is closed or moved out.
        2.  Open the `dev` → `main` PR, titled `chore(release): iteration NN`.
        3.  Ask the owner for approval.
        4.  After the release, run `scripts/factory-metrics.mjs NN` and write
            `docs/iterations/NN.md` from `docs/iterations/TEMPLATE.md`.

#### 14. `.claude/skills/wavely-validate/SKILL.md` (Create)

*   **Type / Scope**: Skill.
*   **Proposed Changes**: Runs, in CI order:
    1.  `bunx tsc --noEmit -p tsconfig.app.json`
    2.  `bunx nx lint`
    3.  `bunx nx run wavely:lint-styles`
    4.  `bunx nx build wavely --configuration=production`
    5.  `bunx nx test wavely --coverage`
    6.  `node --test scripts/factory-metrics.spec.mjs`
    7.  Functional E2E for the affected area, with the same sequence as
        `e2e.yml`:
        1.  `bunx nx build wavely --configuration=e2e && cp dist/wavely/browser/index.csr.html dist/wavely/browser/index.html`
        2.  `CI=true USE_EMULATORS=true FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 bunx firebase-tools emulators:exec --only auth,firestore --project wavely-f659c "bunx nx run e2e:e2e -- --project=chromium <spec files>"`

        `CI=true` makes Playwright serve the built bundle instead of
        `nx serve`. The spec files come from this map of the folders the diff
        touches under `src/app/`:

        | Folder | Specs |
        |---|---|
        | `features/home` | `home.spec.ts` |
        | `features/discover`, `features/browse` | `browse.spec.ts`, `search.spec.ts` |
        | `features/podcast-detail`, `features/publisher` | `podcast-detail.spec.ts` |
        | `features/player` | `player.spec.ts` |
        | `features/library` | `subscription.spec.ts` |
        | `features/login` | `login.spec.ts` |
        | `features/tabs` | `navigation.spec.ts` |
        | anything else | all specs |

    It prints a pass/fail table for the PR that ends with "Left to CI: visual
    comparison".

#### 15. `.claude/skills/wavely-design-check/SKILL.md` (Create)

*   **Type / Scope**: Skill.
*   **Proposed Changes**:
    *   Run the token lint and the `visual-mobile` and `visual-desktop`
        projects.
    *   Collect the diffs from the CI artifacts.
    *   Score each changed screen against `docs/design/rubric.md`.
    *   Write the verdict comment.
    *   Add `status:needs-owner` after the second failed round.

#### 16. `.claude/skills/wavely-security-audit/SKILL.md` (Create)

*   **Type / Scope**: Skill.
*   **Proposed Changes**:
    *   Run `bun audit`.
    *   Grep the diff for key patterns.
    *   Flag changes to `firestore.rules`, `.github/workflows/`, auth code and
        new external hosts.
    *   File findings with the `security` label. Never print secret values.

#### 17. `.claude/skills/wavely-release/SKILL.md` (Create)

*   **Type / Scope**: Skill.
*   **Proposed Changes**:
    1.  Confirm that the promotion PR's checks passed and the owner approved.
    2.  Merge with a merge commit.
    3.  Watch the deploy run with `gh run watch`.
    4.  Confirm the new tag and GitHub release exist.
    5.  Run the smoke spec (item 48a) against production:
        `SMOKE_BASE_URL=https://wavely-f659c.web.app EXPECTED_VERSION=<tag without the leading v> bunx playwright test -c e2e/playwright.config.ts --project=smoke`.
    6.  Ask the owner to confirm that the installed PWA shows the new version
        in Settings within two launches, and record the answer in the
        iteration record.

    On failure, follow `docs/runbooks/rollback.md`.

#### 18. `.claude/skills/wavely-docs-sync/SKILL.md` (Create)

*   **Type / Scope**: Skill.
*   **Proposed Changes**:
    *   List the directories the PR touched.
    *   For each one, update its `EGM.md` (interface, invariants, side effects)
        or add an "EGM: no change because …" line to the PR.
    *   Update AGENTS.md or `docs/` when a rule changed.

#### 19. `.claude/settings.json` (Create)

*   **Type / Scope**: Shared Claude Code settings.
*   **Proposed Changes**:
    *   `"cleanupPeriodDays": 60`, so session logs outlive an iteration for
        `factory-metrics.mjs`.
    *   A permissions allowlist for read-only and routine commands:
        `Bash(bunx nx:*)`, `Bash(bun audit)`, `Bash(gh issue list:*)`,
        `Bash(gh issue view:*)`, `Bash(gh pr list:*)`, `Bash(gh pr view:*)`,
        `Bash(gh pr checks:*)`, `Bash(gh run list:*)`, `Bash(gh run view:*)`,
        `Bash(gh run watch:*)`, `Bash(git status)`, `Bash(git diff:*)`,
        `Bash(git log:*)`.
    *   No hooks. Nothing that writes to GitHub is allowed without a prompt.

#### 20. `.gitignore` (Modify)

*   **Type / Scope**: Git configuration.
*   **Proposed Changes**:
    *   Add `.claude/worktrees/`, `.claude/settings.local.json`, `.agents/` and
        `skills-lock.json`.
    *   After the existing `*.png` rule, add
        `!e2e/src/visual/__screenshots__/**/*.png` and
        `!docs/design/mockups/**/*.png`, so baselines and mockups can be
        committed.
    *   Remove the `src/environments/environment.staging.ts` line.

#### 21. `.github/skills/wavely-orchestrator/`, `wavely-qa/`, `wavely-design/`, `wavely-security/`, `wavely-git-flow/` (Delete)

*   **Type / Scope**: Old Copilot skills.
*   **Proposed Changes**: Delete them. Before the deletion, their still-valid
    content moves to AGENTS.md and the new skills: the security rules to
    `wavely-security-audit`, the QA checklist to `wavely-validate`, and the
    branch rules to AGENTS.md.

#### 22. `.agents/skills/stitch-design/`, `.agents/skills/stitch-loop/`, `skills-lock.json` (Delete, local only)

*   **Type / Scope**: Untracked Stitch skills.
*   **Proposed Changes**: Delete them from the working tree. They are not in
    git.

#### 23. `.github/pull_request_template.md` (Create)

*   **Type / Scope**: PR template.
*   **Proposed Changes**: Sections:
    *   `Closes #`
    *   What changed
    *   Validation (the `wavely-validate` table)
    *   Design verdict (UI changes only)
    *   Docs and EGM (updated, or the reason why not)
    *   Risk (`risk:high`: yes or no, and why)

#### 24. `.github/ISSUE_TEMPLATE/bug.yml`, `feature.yml` (Modify); `chore.yml` (Create)

*   **Type / Scope**: Issue forms.
*   **Proposed Changes**: Add required fields for acceptance criteria and
    size (S/M/L), and a risk checkbox. `chore.yml` covers upgrades, CI and
    docs.

#### 25. `docs/iterations/TEMPLATE.md` (Create)

*   **Type / Scope**: Iteration record template.
*   **Proposed Changes**: Sections:
    *   Issues shipped
    *   Release tag
    *   Metrics (rework rate, review rounds, cost per issue, interventions,
        cycle time)
    *   What went wrong
    *   Change to the factory for next time

#### 26. `scripts/factory-metrics.mjs` (Create)

*   **Type / Scope**: Node script.
*   **Proposed Changes**:
    *   CLI: `node scripts/factory-metrics.mjs <NN>`. The milestone is named
        `Iteration NN`, zero-padded (`Iteration 03`).
    *   It reads the milestone's issues and PRs, and their label events, with
        `gh api`.
    *   **Time window:** from the milestone's first `milestoned` event to the
        merge of the iteration's promotion PR. The cost rules below count only
        sessions whose `lastActivity` falls inside this window. A session
        that spans the window's start is counted whole.
    *   **Rework rate:** shipped issues whose linked PR (via `Closes #N`) had a
        `rework` label event, or that were reopened, ÷ issues shipped.
    *   **Review rounds:** median count of `rework` label events per PR.
    *   **Owner interventions:** `status:needs-owner` label events only.
    *   **Cycle time:** median time from the issue's `milestoned` event to its
        PR's merge.
    *   **Cost per issue:** it runs
        `bunx ccusage claude session --json --offline --since <start> --until <end>`
        (dates as `YYYYMMDD`) and keeps the rows whose `projectPath` starts
        with `<slug>`: the repo's absolute path with every non-alphanumeric
        character replaced by `-`. A row whose `projectPath` matches
        `<slug>--claude-worktrees-<n>-` belongs to issue `<n>`. All other
        rows form one "Shared" row. It prints, per issue and for "Shared",
        the summed `inputTokens`, `outputTokens`, `cacheCreationTokens`,
        `cacheReadTokens` and `totalCost`, then the total cost ÷ issues
        shipped. `--offline` uses the pricing bundled with the pinned
        version, so the numbers do not change between runs.
    *   It exits with code 1 when no row matches the repo in the window, or
        when `ccusage` exits non-zero.
    *   It prints a Markdown table for each formula in §11, and never prints
        message content.

#### 26a. `scripts/factory-metrics.spec.mjs` (Create)

*   **Type / Scope**: Node test (`node --test`).
*   **Proposed Changes**: Fixture GitHub event lists for each formula, and a
    fixture `ccusage` session JSON with a worktree session for an issue, a
    main-repo session ("Shared"), a session from another repo (ignored), a
    session outside the window (ignored), and an empty result (exit code 1).
    The script takes the `ccusage` command from an environment variable, so
    the test feeds the fixture without running `ccusage`.

*(Item 27, `scripts/EGM.md`, moved to issue 3 as item 42a.)*

#### 28. `SDD.md` → `docs/archive/SDD-v1.9.md` (Move)

*   **Type / Scope**: Old system design.
*   **Proposed Changes**: Move it with `git mv` and add a one-line banner:
    "Archived 2026-11. Superseded by AGENTS.md, docs/team.md, the EGM tree and
    docs/designs/wavely-ai-factory.md."

#### 29. `docs/index.html`, `docs/favicon.png` → `landing/index.html`, `landing/favicon.png` (Move)

*   **Type / Scope**: GitHub Pages landing page.
*   **Proposed Changes**: Move the landing page out of `docs/`, so the new team
    docs are not published on the Pages site and doc edits do not trigger
    Pages deploys.

#### 30. `.github/workflows/pages.yml` (Modify)

*   **Type / Scope**: CI workflow.
*   **Proposed Changes**: Change the trigger path and the
    `upload-pages-artifact` path from `docs/` to `landing/`.

#### 31. `2026-11-12_DRIFT_REPORT.md` → `docs/reports/2026-11-12_DRIFT_REPORT.md` (Move)

*   **Type / Scope**: Report.
*   **Proposed Changes**: Move it off the repo root, and update the links to
    it and to `SDD.md` in this document, in AGENTS.md and in root `EGM.md`
    (line 7).

#### 32. `README.md` (Modify)

*   **Type / Scope**: Project README.
*   **Proposed Changes**:
    *   Remove staging: the "Live Environments" row (line 21) and note
        (line 26), `firebase-hosting-staging.yml` in the workflow tree
        (lines 146–148), and the staging and "PR to `main`: Lighthouse CI" rows
        of the CI table (lines 205–207). The git flow (line 216) becomes
        `dev → main`.
    *   Remove the Stitch text (line 13 and lines 337–355).
    *   Point the roadmap to GitHub milestones.
    *   Link `docs/team.md`, `docs/designs/wavely-ai-factory.md` and the
        archived SDD.
    *   Update the landing-page path.

#### 33. `docs/designs/wavely-ai-factory.md` (Create)

*   **Type / Scope**: This design document, finalised.
*   **Proposed Changes**: The final version of this draft. Once it is saved,
    delete the untracked review files at the repo root: `design_draft.md`,
    `concepts_brief.md`, `zoom_out_report.md`, `comprehension_report.md`,
    `critic_report.md`, `intermediate_zoom_out_report.md`,
    `implementation_readiness_report.md` and `goldfish_review_report*.md`.

### Iteration 0, issue 3: Release pipeline (`risk:high`)

#### 34. `.releaserc.json` (Create)

*   **Type / Scope**: semantic-release configuration.
*   **Proposed Changes**:
    *   `branches: ["main"]`
    *   `tagFormat: "v${version}"`, which matches the existing `v1.9.1` tags
    *   `plugins`: `@semantic-release/commit-analyzer`,
        `@semantic-release/release-notes-generator`, `@semantic-release/github`
    *   `"preset": "conventionalcommits"` on commit-analyzer and
        release-notes-generator, which uses the
        `conventional-changelog-conventionalcommits` package already in
        devDependencies.
    *   commit-analyzer `releaseRules`:
        `[{ "type": "chore", "scope": "deps", "release": "patch" }, { "type": "build", "scope": "deps", "release": "patch" }, { "type": "revert", "release": "patch" }]`.

    No npm publishing and no git commit back to `main`.

#### 35. `package.json` and `bun.lock` (Modify)

*   **Type / Scope**: Package manifest.
*   **Proposed Changes**: Every new dependency gets an exact version (no
    caret), checked on the day its issue starts.
    *   Issue 2: add the dev dependency `ccusage` (20.0.50 was checked on
        2026-11-13).
    *   Issue 3: add the dev dependency `semantic-release`, and set `version`
        to `0.0.0-managed-by-semantic-release`.
    *   Issue 4: add the dev dependencies `stylelint` and
        `stylelint-config-standard-scss`, and pin `@playwright/test` to
        `1.58.2`, with no caret, to match the container tag.

#### 36. `.github/workflows/firebase-hosting.yml` (Modify)

*   **Type / Scope**: Production deploy workflow.
*   **Proposed Changes**:
    *   Grant `permissions: contents: write, issues: write,
        pull-requests: write`.
    *   Add `concurrency: { group: deploy-prod, cancel-in-progress: false }`,
        so two merges to `main` never deploy at the same time.
    *   Delete the existing "Create GitHub Release" step. semantic-release
        replaces it.
    *   The steps, in order:
        1.  Check out with `fetch-depth: 0`.
        2.  `actions/setup-node@v4` with Node `22` (kept from today;
            semantic-release needs it).
        3.  Set up bun `1.3.10` and run `bun install --frozen-lockfile`.
        4.  Generate environment stubs (kept from today).
        5.  Run unit tests (kept from today).
        6.  Run `bunx semantic-release` with `GITHUB_TOKEN`.
        7.  `ENV_TARGET=prod node scripts/generate-env.mjs`, with today's
            `env:` block of the eight `NG_APP_*` secrets kept unchanged. It
            reads the new tag. Without `ENV_TARGET=prod`, production would
            build with empty Firebase and Sentry values and still deploy.
        8.  `bunx nx build wavely --configuration=production && cp dist/wavely/browser/index.csr.html dist/wavely/browser/index.html`
            (the copy is kept, because the `**` rewrite targets
            `index.html`).
        9.  `node scripts/stamp-ngsw-version.mjs` (item 42b).
        10. Write `secrets.FIREBASE_SERVICE_ACCOUNT_WAVELY` to
            `$RUNNER_TEMP/sa.json`, and append
            `GOOGLE_APPLICATION_CREDENTIALS=$RUNNER_TEMP/sa.json` to
            `$GITHUB_ENV`.
        11. `bunx firebase-tools deploy --only hosting,firestore:rules --project wavely-f659c`.
        12. `rm -f "$RUNNER_TEMP/sa.json"`, with `if: always()`.

    If semantic-release finds no releasable commit, the deploy still runs and
    the version stays at the latest tag.

#### 37. `.github/workflows/ci.yml` (Modify)

*   **Type / Scope**: CI workflow.
*   **Proposed Changes**:
    *   Rename the `build-and-test` job's `name:` from `Build, Lint & Test` to
        `ci`, the name branch protection requires.
    *   Branches become `[main, dev]`.
    *   Delete the `version-bump-check` job.
    *   The cache key hashes `bun.lock`.
    *   Pin `bun-version: '1.3.10'`.
    *   Add a step `node --test scripts/factory-metrics.spec.mjs`.

#### 37a. `.github/workflows/pr-gates.yml` (Create)

*   **Type / Scope**: CI workflow (required checks).
*   **Proposed Changes**: Trigger `pull_request` with types `opened`,
    `edited`, `synchronize`, `reopened`, `labeled`, `unlabeled`, on branches
    `[main, dev]`. Three jobs, each with `name:` equal to its job ID:
    *   **`pr-title`:** `amannn/action-semantic-pull-request@v5` with types
        `feat`, `fix`, `perf`, `revert`, `chore`, `docs`, `build`, `ci`,
        `test` and `refactor`. GitHub's default `Revert "…"` title fails it,
        so a revert PR is retitled `revert: <original title>`.
    *   **`risk-gate`:** checks out with `fetch-depth: 0` and runs
        `git diff --name-only origin/${{ github.base_ref }}...HEAD`. It fails
        when a changed path matches `.github/workflows/**`,
        `firestore.rules`, `firebase.json`, `.releaserc*`,
        `e2e/src/visual/__screenshots__/**`, `package.json`, `bun.lock`,
        `project.json`, `jest.config.cts`, `.stylelintrc.json`,
        `.claude/settings.json` or `scripts/**`, and the PR has no
        `risk:high` label.
    *   **`verified-gate`:** job-level
        `if: github.base_ref == 'dev' && github.head_ref != 'main'`. The step
        fails until the PR has the `verified` label. On promotions to `main`
        and on back-merges the job is skipped, and GitHub counts a skipped
        required check as passed.

#### 38. `.github/workflows/firebase-hosting-preview.yml`, `firebase-hosting-dev.yml`, `firebase-channel-refresh.yml` (Modify)

*   **Type / Scope**: Deploy workflows.
*   **Proposed Changes**:
    *   In `firebase-hosting-preview.yml`, PR branches become `[main, dev]`.
    *   Every checkout uses `fetch-depth: 0`, so `generate-env.mjs` finds the
        tags. Without it, the build falls back to
        `0.0.0-managed-by-semantic-release`.
    *   Keep `bunx firebase-tools hosting:channel:deploy --json --project wavely-f659c`
        and its URL parsing. Replace `FIREBASE_TOKEN` with a step that writes
        the secret to `$RUNNER_TEMP/sa.json` and appends
        `GOOGLE_APPLICATION_CREDENTIALS` to `$GITHUB_ENV`, plus an
        `if: always()` step that deletes `sa.json`. This applies to every job,
        including `cleanup-preview`.
    *   In `firebase-hosting-dev.yml`, delete the
        `node scripts/firebase-add-auth-domain.mjs` call and its
        `2>/dev/null`. `hosting:channel:deploy` already adds the channel
        domain to Auth's authorized domains, but only logs a warning when that
        fails. So the deploy step saves its log and then fails when the JSON
        output has no `url` or the log contains `authorized domain` or
        `Unable to add`.
    *   In `firebase-channel-refresh.yml`, the `refresh-dev` job deploys
        without building today (lines 51–66). Add the build and the
        `index.csr.html` copy, as in `firebase-hosting-dev.yml:55–56`.
    *   Delete the `refresh-staging` job in `firebase-channel-refresh.yml`,
        and the staging wording in comments.

#### 38a. `scripts/firebase-add-auth-domain.mjs` (Delete)

*   **Type / Scope**: Deploy helper script.
*   **Proposed Changes**: Delete it. `hosting:channel:deploy` already
    authorizes channel domains (`firebase-tools`
    `lib/commands/hosting-channel-deploy.js`, `syncAuthState`).

#### 39. `.github/workflows/firebase-hosting-staging.yml` (Delete)

*   **Type / Scope**: Staging deploy workflow.
*   **Proposed Changes**: Delete it, because the `staging` branch is removed.

#### 40. `.github/workflows/lighthouse.yml` (Modify)

*   **Type / Scope**: Lighthouse report.
*   **Proposed Changes**:
    *   Trigger on `workflow_run` with
        `workflows: ['Deploy to Firebase Hosting']` (`firebase-hosting.yml`).
    *   Replace the URL lookup step (which reads the
        `build-and-deploy-staging` job) with the fixed URL
        https://wavely-f659c.web.app.
    *   Keep the single `lhci autorun … | tee` step as it is. Without
        `pipefail` it never fails the job, so the workflow stays a report,
        not a gate.
    *   Rewrite the header comment (lines 9–13): every category is a warning,
        and nothing blocks a PR.

#### 40a. `.lighthouserc.json` (Modify)

*   **Type / Scope**: Lighthouse configuration.
*   **Proposed Changes**: Change the accessibility assertion from `error` to
    `warn`.

#### 41. `project.json` (Modify)

*   **Type / Scope**: Nx project configuration.
*   **Proposed Changes**: Delete the `staging` build configuration.

#### 42. `scripts/generate-env.mjs` (Modify)

*   **Type / Scope**: Build script.
*   **Proposed Changes**: Remove the `staging` target, the `_STAGING` variable
    lookup and the `environment.staging.ts` output. It does not write to
    `ngsw-config.json`; item 42b stamps the version after the build.

#### 42a. `scripts/EGM.md` (Modify)

*   **Type / Scope**: Contract.
*   **Proposed Changes**: Document `factory-metrics.mjs` and
    `stamp-ngsw-version.mjs`. Remove the `firebase-add-auth-domain.mjs`
    section, including its "failure is non-fatal" rule, and the staging
    target.

#### 42b. `scripts/stamp-ngsw-version.mjs` (Create)

*   **Type / Scope**: Build script, run only by the production workflow
    (item 36, step 9).
*   **Proposed Changes**: Reads the version the way `generate-env.mjs` does
    (latest tag, without the leading `v`), sets `appData.version` in
    `dist/wavely/browser/ngsw.json` and writes the file back. It changes no
    other field and touches no tracked file. `ngsw.json` lists file hashes,
    but nothing hashes `ngsw.json` itself: the service worker only computes
    a hash of the manifest it downloads to tell versions apart, so the patch
    is safe. It exits 1 when the file is missing.

#### 43. `src/environments/EGM.md`, root `EGM.md`, `src/EGM.md` (Modify)

*   **Type / Scope**: Contracts.
*   **Proposed Changes**: Remove the staging environment, and describe the
    release and deploy flow.

### Iteration 0, issue 4: Checks (`risk:high`, creates baselines)

#### 44. `.stylelintrc.json` (Create)

*   **Type / Scope**: Stylelint configuration.
*   **Proposed Changes**: Exactly this, apart from the `null` entries:

    ```json
    {
      "extends": "stylelint-config-standard-scss",
      "rules": {
        "declaration-property-value-disallowed-list": [
          {
            "/^padding/":  ["/(?<!var\\([^)]*)-?\\b\\d*\\.?\\d+(px|rem)\\b/"],
            "/^margin/":   ["/(?<!var\\([^)]*)-?\\b\\d*\\.?\\d+(px|rem)\\b/"],
            "gap":         ["/(?<!var\\([^)]*)-?\\b\\d*\\.?\\d+(px|rem)\\b/"],
            "font-size":   ["/(?<!var\\([^)]*)-?\\b\\d*\\.?\\d+(px|rem)\\b/"],
            "line-height": ["/(?<!var\\([^)]*)-?\\b\\d*\\.?\\d+(px|rem)\\b/"],
            "/^color$/":   ["/(?<!var\\([^)]*)#[0-9a-fA-F]{3,8}\\b/", "/(?<!var\\([^)]*)rgba?\\(/"],
            "/^background/": ["/(?<!var\\([^)]*)#[0-9a-fA-F]{3,8}\\b/", "/(?<!var\\([^)]*)rgba?\\(/"],
            "box-shadow":  ["/(?<!var\\([^)]*)-?\\b\\d*\\.?\\d+(px|rem)\\b/", "/(?<!var\\([^)]*)#[0-9a-fA-F]{3,8}\\b/", "/(?<!var\\([^)]*)rgba?\\(/"]
          },
          { "severity": "warning" }
        ]
      }
    }
    ```

    *   The patterns are not anchored, so `8px 16px` and `0 1px 2px rgba(…)`
        are caught. The lookbehind skips a value inside a `var(--x, …)`
        fallback. A bare `0` has no unit and is allowed.
    *   Only the token rule is a warning. The standard rules keep their
        default severity, `error`. At the start of issue 4 the engineer runs
        stylelint once, and each standard rule that fails on the current SCSS
        is added to `rules` as `null`. After that, every warning is a token
        warning, so `--max-warnings` counts only those.

#### 44a. `project.json` (Modify) and `.github/workflows/ci.yml` (Modify)

*   **Type / Scope**: Nx target and CI step.
*   **Proposed Changes**:
    *   A `lint-styles` target (`nx:run-commands`) that runs
        `stylelint "src/app/**/*.scss" --max-warnings <N>`, where N is the
        warning count when the target is created. Each token group lowers N.
    *   A `bunx nx run wavely:lint-styles` step in `ci.yml`.

#### 44b. `jest.config.cts` (Modify)

*   **Type / Scope**: Unit test configuration.
*   **Proposed Changes**: Run `bunx nx test wavely --coverage`, round each
    global total down to a whole percentage, and write the four values into
    `coverageThreshold.global` (today 70/60/70/70, lines 31–38). Later PRs may
    only raise them.

#### 45. `e2e/playwright.config.ts` (Modify)

*   **Type / Scope**: Playwright configuration.
*   **Proposed Changes**:
    *   Keep `chromium` as the first project (global setup reads
        `projects[0].use.baseURL`) and add `testIgnore: /(visual|smoke)\//`
        to it.
    *   Add `chromium-mobile` (Pixel 7 device settings,
        `testIgnore: /(visual|smoke)\//`) for the functional specs on a
        mobile viewport. Delete the local-only `firefox`, `webkit`,
        `Mobile Chrome` and `Mobile Safari` projects, so the visual specs
        never run in them.
    *   Add a `smoke` project: `testMatch: /smoke\/.*\.spec\.ts/`,
        `use: { baseURL: process.env.SMOKE_BASE_URL }`. When
        `SMOKE_BASE_URL` is set, `webServer` is `undefined`, so no local
        server starts. Global setup already runs only with
        `USE_EMULATORS=true`.
    *   Add the projects `visual-mobile` (390×844, `isMobile`, `hasTouch`) and
        `visual-desktop` (1024×768). Both use `testMatch: /visual\/.*\.spec\.ts/`.
    *   Set `expect.toHaveScreenshot` to `{ maxDiffPixelRatio: 0.01,
        animations: 'disabled' }` and
        `snapshotPathTemplate: '{testDir}/visual/__screenshots__/{projectName}/{arg}{ext}'`.

#### 46. `e2e/src/helpers/network-fixtures.ts` (Create)

*   **Type / Scope**: Test helper.
*   **Proposed Changes**: `useNetworkFixtures(page)` registers `page.route`
    handlers for `itunes.apple.com`, `all.api.radio-browser.info`,
    `corsproxy.io`, direct RSS URLs, and the audio `previewUrl` hosts
    (`*.mzstatic.com`, `*.apple.com`). It serves the files in `e2e/fixtures/`:

    | Request | Fixture |
    |---|---|
    | `itunes.apple.com/*/rss/toppodcasts*` | `itunes-top.json` |
    | `itunes.apple.com/search*` | `itunes-search.json` |
    | `itunes.apple.com/lookup*` with `entity=podcastEpisode` | `itunes-episodes.json` |
    | other `itunes.apple.com/lookup*` | `itunes-lookup.json` |
    | `all.api.radio-browser.info/**` | `radio-stations.json` |
    | `corsproxy.io/**` and direct RSS feed URLs | `rss-feed.xml` |
    | `*.mzstatic.com`, `*.apple.com` and `example.com` images | `src/assets/default-artwork.svg` |
    | audio `previewUrl` and enclosure URLs | `silence.mp3` |

    Only `localhost` and `127.0.0.1` (the app and the emulators) may be
    reached without a route. Any other request fails the test. A test that
    needs different data (empty results, counts, specific IDs) registers its
    own `page.route` after calling `useNetworkFixtures(page)`. Playwright
    tries the most recently registered matching route first, so the
    per-test route wins.

#### 46a. `e2e/src/home.spec.ts`, `search.spec.ts`, `browse.spec.ts`, `podcast-detail.spec.ts`, `player.spec.ts`, `subscription.spec.ts`, `navigation.spec.ts` (Modify)

*   **Type / Scope**: Functional E2E specs.
*   **Proposed Changes**: Call `useNetworkFixtures(page)` in each spec, and
    replace the inline iTunes `page.route` regexes that only serve default
    data. Per-test routes that serve special data stay, registered after the
    fixtures. Functional E2E then also runs on fixed data.

#### 47. `e2e/fixtures/itunes-top.json`, `itunes-search.json`, `itunes-lookup.json`, `itunes-episodes.json`, `rss-feed.xml`, `radio-stations.json`, `silence.mp3`, `EGM.md` (Create)

*   **Type / Scope**: Test data.
*   **Proposed Changes**: Small, fixed responses with neutral made-up podcast
    and station names. Episode dates are set relative to 2026-11-01, the
    fixed test clock. Artwork URLs point to local `/default-artwork.svg`.
    `EGM.md` explains that this folder holds network data, unlike
    `e2e/src/fixtures/`, which holds Playwright fixtures.

#### 48. `e2e/src/visual/pages.visual.spec.ts` (Create)

*   **Type / Scope**: Visual E2E tests.
*   **Proposed Changes**: One test per page: login, home, discover, radio,
    library, settings, podcast detail, publisher, category detail, and the
    full player opened from the mini player. Each test:
    *   calls `page.clock.setFixedTime(new Date('2026-11-01T12:00:00Z'))`
        before navigating;
    *   uses the auth fixture, except login, which uses a signed-out context;
    *   uses `useNetworkFixtures`, waits for its content, and calls
        `toHaveScreenshot('<page>.png')`.

#### 48a. `e2e/src/smoke/prod.smoke.spec.ts` (Create)

*   **Type / Scope**: Production smoke test, run by `wavely-release` and
    excluded from the CI projects.
*   **Proposed Changes**: Runs only in the `smoke` project (item 45), against
    `SMOKE_BASE_URL`, signed out, with real network data.
    *   Fixed IDs, as constants at the top of the spec: the podcast ID
        `1200361736` (a long-running daily show), and the publisher ID taken
        from the `artistId` field of
        `https://itunes.apple.com/lookup?id=1200361736` when the spec is
        written.
    *   `/login`: waits for the sign-in button (`getByRole('button')` with
        the sign-in label).
    *   `/podcast/<id>`: waits for the podcast title heading and at least
        one episode row.
    *   `/publisher/<id>`: waits for at least one podcast card.
    *   Fetches `/ngsw.json` and passes only when `appData.version` equals
        `process.env.EXPECTED_VERSION` (the tag without the leading `v`).

#### 49. `e2e/src/visual/__screenshots__/**` (Create, generated)

*   **Type / Scope**: Baselines.
*   **Proposed Changes**: These are generated only by `visual-baselines.yml`.
    The owner approves the first set, because the PR is `risk:high`.

#### 50. `.github/workflows/visual-baselines.yml` (Create)

*   **Type / Scope**: CI workflow (manual).
*   **Proposed Changes**: Runs on `workflow_dispatch` against the current
    branch, in container `mcr.microsoft.com/playwright:v1.58.2-noble`, with
    permission `contents: read`. The steps, in order:
    1.  `actions/checkout@v4`.
    2.  `oven-sh/setup-bun@v2` with bun `1.3.10`, then
        `bun install --frozen-lockfile`.
    3.  `actions/setup-java@v4` with temurin 21 (the emulators need it).
    4.  `node scripts/generate-env.mjs` (stubs).
    5.  `bunx nx build wavely --configuration=e2e && cp dist/wavely/browser/index.csr.html dist/wavely/browser/index.html`.
        The job builds its own bundle.
    6.  `CI=true USE_EMULATORS=true FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 bunx firebase-tools emulators:exec --only auth,firestore --project wavely-f659c "bunx nx run e2e:e2e -- --project=visual-mobile --project=visual-desktop --update-snapshots"`.
    7.  Upload `e2e/src/visual/__screenshots__/` as the artifact
        `visual-baselines`.

    After the run, the owner runs
    `gh run download <run-id> -n visual-baselines -D e2e/src/visual/__screenshots__`,
    commits and pushes. That push triggers CI as normal.

#### 51. `.github/workflows/e2e.yml` (Modify)

*   **Type / Scope**: E2E workflow.
*   **Proposed Changes**:
    *   PR branches become `[main, dev]`.
    *   Keep bun `1.3.10` (already pinned).
    *   Replace the `e2e` job with two jobs. Their `name:` values are the
        required check names in Owner action 4:
        *   `name: e2e (functional)`, on `ubuntu-latest`: today's steps,
            running the `chromium` and `chromium-mobile` projects.
        *   `name: e2e (visual)`: the `visual-mobile` and `visual-desktop`
            projects, with steps 1–6 of item 50 but without
            `--update-snapshots`. It builds its own bundle.
    *   Both jobs upload the Playwright HTML report and test output (the
        folders `nxE2EPreset` sets under `dist/.playwright/e2e/`) as
        artifacts, with `if: always()`.
    *   Remove the comment about a future staging smoke test.

#### 52. `e2e/EGM.md`, `e2e/src/EGM.md`, `e2e/src/helpers/EGM.md` (Modify); `e2e/src/visual/EGM.md` (Create)

*   **Type / Scope**: Contracts.
*   **Proposed Changes**: Document the visual projects, the fixtures, the
    baseline workflow and the approval rule.

#### 53. `docs/design/README.md`, `docs/design/rubric.md`, `docs/design/mockups/.gitkeep` (Create)

*   **Type / Scope**: Design docs.
*   **Proposed Changes**:
    *   **README:** the token spec, which lists the current
        `--wavely-spacing-*` and the planned `--wavely-type-*`; the rule
        "content-first, artwork-led, bottom navigation, no Google branding";
        and the mockup index.
    *   **Rubric:** six criteria scored 1–3, with examples: hierarchy,
        spacing, density, type, restraint and accessibility, as defined in §7.
        A screen passes when no score is 1.

### Iteration 0, issue 5: PWA safety

#### 54. `src/app/core/services/app-update.service.ts` (Create) and `.spec.ts`

*   **Type / Scope**: TypeScript service and test.
*   **Proposed Changes**:
    *   `AppUpdateService` (root) injects `PLATFORM_ID`. It returns at once
        unless `isPlatformBrowser(...)` and `SwUpdate.isEnabled` are both true,
        before it touches `document`. The app is prerendered on the server, so
        this check must come first.
    *   It subscribes to `SwUpdate.versionUpdates`. On `VERSION_READY`, it sets
        a pending flag. It calls `activateUpdate()` and
        `document.location.reload()` on the next `visibilitychange` to visible,
        but only when `PlayerStore.isPlaying()` is false.
    *   On `SwUpdate.unrecoverable`, it reloads under the same idle condition.
    *   Tests cover: no reload while playing, reload when idle, no-op when
        disabled, no-op on the server platform, and the unrecoverable case.

#### 55. `src/app/app.ts` (Modify)

*   **Type / Scope**: Root component.
*   **Proposed Changes**: Inject `AppUpdateService` next to the other services
    that are started eagerly.

*(Items 56–57 were removed: no localStorage schema version is added; see §10.)*

#### 58. `firebase.json` (Modify)

*   **Type / Scope**: Hosting configuration.
*   **Proposed Changes**: Replace the existing one-year rule with these
    `headers`, in this order:
    1.  `{"source": "**", "headers": [{"key": "Cache-Control", "value": "no-cache"}]}`.
        This covers `index.html`, every SPA path served through the `**`
        rewrite, `ngsw.json`, and the three worker scripts that rule 3
        excludes (`ngsw-worker.js`, `safety-worker.js`,
        `worker-basic.min.js`).
    2.  `{"source": "**/*.@(css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)", "headers": [{"key": "Cache-Control", "value": "max-age=31536000"}]}`.
        This is today's extension list minus `js`, plus `webp`.
    3.  `{"source": "**/!(ngsw-worker|safety-worker|worker-basic.min).js", "headers": [{"key": "Cache-Control", "value": "max-age=31536000"}]}`.

    Check on a preview deploy: run `curl -I` on `/tabs/home`, `/ngsw.json`,
    `/ngsw-worker.js` and one hashed bundle, and confirm that each gets the
    expected `Cache-Control`.

#### 59. `docs/runbooks/rollback.md` (Create)

*   **Type / Scope**: Runbook.
*   **Proposed Changes**: Steps and commands for:
    *   rolling Hosting back to the previous release in the Firebase console
        or with `firebase hosting:clone`;
    *   redeploying rules from the previous tag;
    *   forcing a PWA update (clear site data or reopen the app);
    *   checking sign-in and playback.

#### 60. `src/app/EGM.md`, `src/app/core/services/EGM.md`, `src/EGM.md` (Modify)

*   **Type / Scope**: Contracts.
*   **Proposed Changes**: Document `AppUpdateService` and the cache headers.

### Iterations 1–4: Dependency upgrade (Part C)

Each step is one `chore(deps)` issue labelled `risk:high`, approved by the
owner. Steps in the same iteration ship in that iteration's release. Before
each step, the engineer adds a compatibility table built from
`peerDependencies` to the issue. A step that changes rendering follows the
baseline rule in §9.

Steps 0 and 1 are listed in full. For steps 2–8, the files below are the ones
the tooling is likely to touch. The exact file list is confirmed in the step's
issue on the day the step starts, because it depends on releases that do not
exist yet.

#### 61. Step 0: remove Capacitor

*   **Delete:**
    *   `android/` and `ios/`, with their EGM.md files;
    *   `capacitor.config.ts`.
*   **Modify:**
    *   `package.json` and `bun.lock`: remove every `@capacitor/*` package and
        the `cap:build`, `cap:sync`, `cap:ios`, `cap:android` and `cap:serve`
        scripts.
    *   `.gitignore`: remove the native build lines.
    *   `README.md`: remove the iOS and Android claims.
    *   Root `EGM.md`: remove the android and ios entries and the Capacitor
        paragraph.

#### 62. Step 1: minor and patch updates

*   **Modify:** `package.json` and `bun.lock`: every package moves to the
    latest release in its current major. `@playwright/test` and the container
    tag in `e2e.yml` and `visual-baselines.yml` are bumped together. If the
    Chromium bump changes screenshots, this PR also holds the regenerated
    baselines (§9 rule).

#### 61a. Iteration 1, separate `chore` issue (not an upgrade step): remove the dead browse page

*   **Delete:** `src/app/features/browse/browse.page.ts`, `.html`, `.scss`
    and `.spec.ts`. The `browse` route already redirects to Discover, and the
    drift report marks the page as dead code.
*   **Keep:** `browse.constants.ts`. `discover.page.ts` and
    `category-detail.page.ts` import it.
*   **Modify:** `src/app/features/browse/EGM.md`: remove the page, and keep
    the constants and `category-detail/`.

#### 63. Steps 2–3: Nx 23, then Nx 24

*   **Likely files:** Nx config, project and tsconfig files (including
    `e2e/tsconfig.json`), jest and eslint config, as `nx migrate` writes them.
    Run `nx migrate --run-migrations`, then delete `migrations.json`.

#### 64. Step 4: Sentry 11, ngx-translate 18

*   **Likely files:** `src/main.ts` and `src/app/app.config.ts` (Sentry init,
    translate providers), plus the `TranslateService` call sites the release
    notes list.

#### 65. Step 5: Angular 22, NgRx Signals 22, angular-eslint, jest-preset-angular, @testing-library/angular

*   **Likely files:** whatever the `ng update` and `nx migrate` schematics
    change, plus the EGM.md files whose documented APIs change. If screenshots
    change, the baselines go in the same PR (§9 rule).

#### 66. Step 6: Firebase 13, @angular/fire 21

*   **Likely files:** `src/app/app.config.ts`, `src/app/app.ts`,
    `src/app/core/auth/auth.service.ts`, `src/app/core/guards/auth.guard.ts`
    and the four `*-sync.service.ts` files.
*   **Wait condition:** this step waits until `@angular/fire` 21 is stable and
    its peer range includes Angular 22.

#### 67. Step 7: Ionic 9

*   **Likely files:** `src/app/app.config.ts` (`provideIonicAngular`) and the
    component templates that use removed Ionic APIs.
*   **Baselines:** regenerated in the same PR by `visual-baselines.yml`, with
    no page or token edits. The owner reviews the diff images (§9 rule).
    Token groups start only after this step merges.

#### 68. Step 8: TypeScript next major (only if Angular supports it)

*   **Likely files:** `package.json`, `bun.lock` and the `tsconfig*.json`
    files.

### Iteration 4 onward: Design tokens (Part D)

#### 69. `src/styles.scss` (Modify)

*   **Type / Scope**: Global styles and tokens.
*   **Proposed Changes**:
    *   Add the `--wavely-type-*` tokens: caption, body, body-strong, title and
        headline, each with a size, line height and weight.
    *   Consolidate the existing `--ion-*` declarations into one block that
        maps the tokens to Ionic variables.
    *   Merge the `!important` breakpoint overrides and the duplicated
        dark-mode blocks into the token layer.

#### 70. Page style files, one issue per group (Modify)

*   **Type / Scope**: Component SCSS.
*   **Proposed Changes**: Replace raw values with tokens until the lint count
    for the group is 0, and lower `--max-warnings` in `project.json` to the
    new total.
*   **Groups** (paths under `src/app/`; the folder list for each group is
    confirmed in its issue):
    1.  `features/home/`, `features/discover/`
    2.  `features/library/`, `features/settings/`, `features/login/`
    3.  `features/podcast-detail/`, `features/publisher/`,
        `features/browse/category-detail/`
    4.  `features/radio/`, `features/tabs/`, `app.scss`
    5.  `features/player/`, which also removes 8 hard-coded colours
    6.  `shared/components/`

    Baselines are regenerated by `visual-baselines.yml`, and the owner
    approves them.

#### 71. `.stylelintrc.json` (Modify, final group)

*   **Type / Scope**: Lint configuration.
*   **Proposed Changes**: Switch the rule from `warning` to `error` once the
    total count is 0.

#### 72. `docs/design/README.md` (Modify, each group)

*   **Type / Scope**: Design docs.
*   **Proposed Changes**: Record the adopted tokens and the mockups used.

### Verification Plan

*   **Compilation/Build**: `bunx nx build wavely --configuration=production`.
*   **Unit Tests**: `bunx nx test wavely`, plus the new tests for
    `AppUpdateService` and the `loadFromFirestore` guards; and
    `node --test scripts/factory-metrics.spec.mjs`, which also runs in
    `ci.yml`.
*   **Static Analysis & Linting**:
    *   `bunx nx lint`;
    *   `bunx tsc --noEmit -p tsconfig.app.json`;
    *   `bunx nx run wavely:lint-styles`, which fails when the warning count
        exceeds `--max-warnings`. The count must be 0 by the end of Part D.
    *   `pr-gates.yml`: `pr-title`, `risk-gate` and `verified-gate` pass.
*   **Test Coverage Requirement**: In iteration 0 (item 44b),
    `coverageThreshold` in `jest.config.cts` is set to the current totals. It may only be raised. New
    services and functions must have tests for every branch described in their
    contract.
*   **E2E/Integration**: the `e2e (functional)` check (`chromium` and
    `chromium-mobile`, on `ubuntu-latest`) and the `e2e (visual)` check
    (`visual-mobile` and `visual-desktop`, in the pinned container), both
    with the emulators and `USE_EMULATORS=true`. Both must pass on every PR
    to `dev` and `main`. The `smoke` project never runs in CI.
*   **Release checks** (every iteration):
    *   when the iteration contains a releasable commit, a tag and GitHub
        release exist for the promotion;
    *   `prod.smoke.spec.ts` passes, and production's `ngsw.json` shows that
        version;
    *   the owner confirms that the installed PWA shows the new version within
        two launches;
    *   Lighthouse runs.
*   **Factory checks** (every iteration):
    *   `docs/iterations/NN.md` exists, with every metric filled from
        `scripts/factory-metrics.mjs`;
    *   from iteration 1 on, the iteration review compares the rework rate,
        cost per issue and interventions with the previous iteration.
*   **Program success:**
    *   all nine dependencies on current majors by the end of iteration 4
        (TypeScript excepted, if unsupported);
    *   a token lint count of 0;
    *   fewer than 20 open issues, each with a priority and an iteration;
    *   every iteration ends with a release that reaches the installed PWA
        within two launches;
    *   the three deciding metrics from Goals (rework rate, cost per issue,
        owner interventions) are recorded every iteration, and owner
        interventions stay flat or fall from iteration to iteration.

--------------------------------------------------------------------------------

*Drafted with EGM*

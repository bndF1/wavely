<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## 🔒 Security — ABSOLUTE RULES (never break, no exceptions)

**NEVER commit secrets, credentials, or tokens to the repository.** This has caused real leaks before.

| What | Where it lives instead |
|------|----------------------|
| Firebase config (apiKey, projectId, etc.) | GitHub Actions secrets → `scripts/generate-env.mjs` generates env files at build time |
| Firebase Admin SDK service account JSON | GitHub Actions secret `FIREBASE_SERVICE_ACCOUNT_WAVELY` |
| Sentry DSN | GitHub Actions secret `NG_APP_SENTRY_DSN` |
| API keys (Podcast Index, etc.) | GitHub Actions secrets or `.env` (gitignored) |
| Firebase auth tokens / storage state | `e2e/.auth/` (gitignored) |

**Rules for agents:**
1. **Never hardcode** API keys, tokens, passwords, or any secret in source files
2. **Never print or log** secret values — not even partially (no `key.substring(0,8)`)
3. **If a file contains secrets, it must be in `.gitignore`** — verify before committing
4. **Use `NG_APP_*` prefix** for env vars injected via `generate-env.mjs` — they are build-time only
5. **When in doubt, use a placeholder** like `process.env.MY_SECRET` and document where to set it
6. **Before every commit, mentally scan staged files** — if any file contains a real key/token, abort

The environment files (`src/environments/environment*.ts`) are gitignored **on purpose** — they are generated at build time. Do not regenerate them with real credentials and commit them.

## Project Management

- **Task tracker**: GitHub Issues on `bndF1/wavely` (NOT Linear)
- GitHub MCP tools are read-only; issue creation requires `gh auth login` or a PAT passed via env
- To authenticate: `gh auth login` or `export GITHUB_TOKEN=<pat>` then use `gh` CLI

## Git Workflow (MANDATORY — follow every time)

> Invoke the `wavely-git-flow` skill for detailed branching rules, commit conventions, and CI gates.

**Branch hierarchy**: `feature/*` → PR → `dev` → PR → `staging` → PR → `main`

| Branch | Auto-deploy |
|--------|------------|
| `main` | Production (https://wavely-f659c.web.app) + semantic-release |
| `staging` | Staging preview (https://wavely-f659c--staging.web.app) |
| `dev` | CI tests only |

**Rules (never break these):**
1. Never commit directly to `main` or `staging` — always via PR
2. `feature/*` branches off `dev`
3. Hotfixes branch off `main`, PR to `main`, then backport to `dev`
4. Use Conventional Commits: `feat(scope): description`, `fix(scope): description`, `chore(scope): description`
5. E2E tests are a required gate for PRs to `staging` and `main`

**CI gates:**
- PRs → `dev`: unit tests only
- PRs → `staging`: unit tests + E2E (Playwright + emulators)
- PRs → `main`: unit tests + E2E + Lighthouse CI

## Bug Tracking Methodology (MANDATORY)

Every bug — whether found in QA, code review, user report, or automated tests — **must have a GitHub issue filed before any fix is committed.**

### Bug lifecycle

1. **Discover bug** → immediately file a GitHub issue (do not fix without an issue)
2. **File issue** with full context:
   ```bash
   gh issue create \
     --repo bndF1/wavely \
     --title "bug(scope): short description" \
     --label "bug" \
     --body "## Steps to Reproduce\n1. \n\n## Expected\n\n## Actual\n\n## Root Cause (if known)\n\n## Fix"
   ```
3. **Branch from dev**: `git checkout -b fix/{issue-number}-short-desc dev`
4. **Fix + tests** on the branch
5. **PR to dev** — PR description must include `Closes #<issue-number>`
6. Issues auto-close when the PR merges

### Priority labels

| Label | Meaning | Response time |
|-------|---------|--------------|
| `priority: P0` | Production down / security breach | Fix immediately |
| `priority: P1` | Core feature broken for all users | Fix in current cycle |
| `priority: P2` | Feature degraded or workaround exists | Fix in next cycle |
| `priority: P3` | Minor / cosmetic | Backlog |

### Security bugs

Security issues follow the same flow **plus** the [security rules](#-security--absolute-rules-never-break-no-exceptions) above. Invoke the `wavely-security` skill for triage.

---

## Agent Ecosystem

Wavely has specialized sub-agents. Always delegate instead of doing work directly.

| Skill | When to invoke |
|-------|---------------|
| `wavely-orchestrator` | Start here for any task — decomposes and delegates |
| `wavely-qa` | Testing, regression, pre-release sweeps, accessibility |
| `wavely-design` | UI/UX reviews, design system, landing page |
| `wavely-security` | Firebase key rotation, Firestore rules, security alerts |
| `wavely-git-flow` | Branch strategy, PR creation, conflict resolution |

Agents can and should run **in parallel** when their tasks are independent.

---

## Implementation Roadmap (Milestones)

| Milestone | GitHub | Focus |
|-----------|--------|-------|
| v0.5.0 — Security & Stability | #1 | Firestore rules (#27), auth fix (#33), E2E suite (#31), unit test coverage (#32) |
| v1.0.0 — MVP | #2 | Listening history (#28), Up Next queue (#34), lockscreen audio (#35), error states (#36), Lighthouse (#37) |
| v1.1.0 — Discovery & Library | #3 | Search history (#38), episode filtering (#39), browse improvements (#40) |
| v1.2.0 — Native Platform | #4 | Push notifications (#41), deep links (#42), App Store (#43), share sheet (#44) |
| v2.0.0 — Advanced Features | #5 | Sleep timer (#45), chapters (#46), CarPlay (#47), offline downloads (#48) |

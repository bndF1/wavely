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

## Implementation Roadmap (Milestones)

| Milestone | GitHub | Focus |
|-----------|--------|-------|
| v0.5.0 — Security & Stability | #1 | Firestore rules (#27), auth fix (#33), E2E suite (#31), unit test coverage (#32) |
| v1.0.0 — MVP | #2 | Listening history (#28), Up Next queue (#34), lockscreen audio (#35), error states (#36), Lighthouse (#37) |
| v1.1.0 — Discovery & Library | #3 | Search history (#38), episode filtering (#39), browse improvements (#40) |
| v1.2.0 — Native Platform | #4 | Push notifications (#41), deep links (#42), App Store (#43), share sheet (#44) |
| v2.0.0 — Advanced Features | #5 | Sleep timer (#45), chapters (#46), CarPlay (#47), offline downloads (#48) |

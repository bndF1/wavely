---
name: wavely-git-flow
description: >
  Enforces the Wavely project git branching workflow. Invoke whenever creating branches,
  opening PRs, merging, or discussing where code should land. This skill is project-specific
  to bndF1/wavely.
---

# Wavely Git Flow

## Branch Hierarchy

```
feature/*  ──PR──►  dev  ──PR──►  staging  ──PR──►  main
                                              ↑
                                          hotfix/*
```

| Branch | Purpose | Auto-deploy target |
|--------|---------|-------------------|
| `main` | Production-stable | https://wavely-f659c.web.app (prod) + semantic-release tag |
| `staging` | Pre-production validation | Firebase channel — URL in GitHub Deployments → "staging" environment |
| `dev` | Active integration | Firebase channel — URL in GitHub Deployments → "dev" environment |
| `feature/*` | Feature work | Preview channel — URL posted as PR comment |
| `hotfix/*` | Emergency production fixes | PR directly to `main` + backport to `dev` |

> **Finding dev/staging URLs**: Firebase preview channel URLs include a random hash (e.g.
> `wavely-f659c--dev-fbowlyi7.web.app`). The hash is stable as long as the channel doesn't
> expire. Find the current URL under **GitHub → Deployments** or in the latest workflow run's
> job summary. A weekly cron (`firebase-channel-refresh.yml`) prevents expiry.

## Rules — Follow EVERY Time

1. **Never push directly to `main` or `staging`** — always go via PR
2. **Feature branches branch off `dev`**: `git checkout -b feature/my-feature dev`
3. **PR flow**: `feature/*` → `dev` → `staging` → `main` (never skip a level)
4. **Hotfixes** branch off `main`, PR to `main`, then immediately backport to `dev`
5. **Branch naming**: `feature/short-description`, `fix/bug-name`, `chore/task-name`, `hotfix/critical-fix`

## Commit Convention (Conventional Commits)

Format: `<type>(<scope>): <short description>`

| Type | When |
|------|------|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `chore` | Tooling, CI, dependencies, refactoring |
| `docs` | Documentation only |
| `test` | Tests only |
| `perf` | Performance improvement |
| `refactor` | Code restructure without behaviour change |

**Scopes** (optional but recommended): `player`, `library`, `search`, `browse`, `home`, `auth`, `native`, `infra`

Examples:
```
feat(player): add sleep timer with fade-out
fix(auth): handle configuration-not-found for Google Sign-In
chore(ci): add Lighthouse CI job to staging PR gate
test(library): add E2E flow for subscription management
```

Breaking changes: add `!` after type/scope → `feat(player)!: remove speed presets`

## CI Gates

| Target branch | Required checks |
|---------------|----------------|
| PRs to `dev` | ✅ Unit tests (`jest`) |
| PRs to `staging` | ✅ Unit tests + ✅ E2E (Playwright + emulators) |
| PRs to `main` | ✅ Unit tests + ✅ E2E + ✅ Lighthouse CI |

## Semantic Release

`semantic-release` runs automatically on push to `main`:
- `feat` → minor version bump (1.0.0 → 1.1.0)
- `fix` / `perf` → patch bump (1.0.0 → 1.0.1)
- Breaking change (`!`) → major bump (1.0.0 → 2.0.0)

On `dev` branch: pre-release tags (e.g., `1.1.0-beta.1`)

## Firebase Preview Channels

Every PR gets an ephemeral preview URL automatically:
```
https://wavely-f659c--pr-<number>-<hash>.web.app
```

These expire after 7 days (configured in `firebase.json`).

## README & Landing Page Updates (MANDATORY)

For **every promotion PR** (`feature/*` → `dev`, `dev` → `staging`, `staging` → `main`), the README and landing page **must** be updated to reflect what's been built. This is non-negotiable — do it as part of the promotion PR, not as a follow-up.

| Promotion | What to update |
|-----------|----------------|
| `feature/*` → `dev` | README: mark the feature as in-progress or done in the roadmap/changelog; landing: update if user-facing |
| `dev` → `staging` | README: update milestone progress, feature list, "What's new" section; landing: reflect any new capabilities |
| `staging` → `main` | README: finalize release notes, bump "Current version" badge; landing: full update for production |

**Checklist before opening a promotion PR:**
- [ ] README reflects the features included in this promotion
- [ ] Landing page updated if any user-facing change is included
- [ ] Version badge / "Latest release" line in README is accurate

---

## Standard Workflow

```bash
# Start a feature
git checkout dev && git pull origin dev
git checkout -b feature/my-feature

# Work, commit with conventional commits
git add -p
git commit -m "feat(player): add sleep timer"

# Push and open PR → dev
git push -u origin feature/my-feature
gh pr create --base dev --title "feat(player): add sleep timer" --body "Closes #45"

# After PR merged to dev, create PR dev → staging
gh pr create --base staging --head dev --title "chore: promote dev to staging [v1.1.0]"

# After staging validation, create PR staging → main
gh pr create --base main --head staging --title "chore: release v1.1.0"
```

## PR Description Template

When opening a PR:
```markdown
## Summary
<!-- What does this PR do? -->

## Changes
- 

## Testing
- [ ] Unit tests added/updated
- [ ] E2E test added (if user-facing change)
- [ ] Tested manually on web
- [ ] Tested manually on iOS/Android (if native change)

## Related Issues
Closes #<issue number>
```

## Do NOT

- `git push --force` on `main`, `staging`, or `dev`
- Merge without a passing CI check
- Skip the `dev` → `staging` → `main` promotion chain
- Use personal branch names like `bene/fix` — use `fix/description` instead
- **Commit secrets, credentials, API keys, or tokens — EVER** (this has caused real leaks)
- Commit generated environment files (`src/environments/environment*.ts`) — they are gitignored on purpose
- Hardcode Firebase config, Sentry DSN, or any API key directly in source files
- Log or print secret values, even partially

## Where Secrets Live

All secrets are stored in **GitHub Actions secrets** and injected at build time via `scripts/generate-env.mjs`:

| Secret | Used for |
|--------|----------|
| `FIREBASE_CONFIG` | Firebase web app config (apiKey, projectId, etc.) |
| `FIREBASE_SERVICE_ACCOUNT_WAVELY` | Firebase Admin SDK (E2E global setup) |
| `NG_APP_SENTRY_DSN` | Sentry error tracking DSN |

For local dev, copy `.env.example` → `.env` and fill in values. The `.env` file is gitignored.

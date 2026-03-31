# CI/CD Workflows

This file documents the GitHub Actions workflows for this repository.
It is intentionally kept under `.github` and not in product/project docs.

## Workflow Files

- `workflows/ci-build-test.yml`
  - Name: `CI - Push Checks`
  - Trigger: push to all branches
  - Purpose: lint, build, and backend tests for branch pushes

- `workflows/pr-checks.yml`
  - Name: `CI - PR Checks`
  - Trigger: pull requests (opened, synchronize, reopened, ready_for_review)
  - Purpose: lint, build, tests, coverage, and PR status summary

- `workflows/deploy-production.yml`
  - Name: `Deploy - Production`
  - Trigger: push to `main`, manual dispatch
  - Purpose: build artifacts and deploy to production environment

- `workflows/deploy-staging.yml`
  - Name: `Deploy - Staging`
  - Trigger: push to `develop`, manual dispatch
  - Purpose: build artifacts and deploy to staging environment

- `workflows/security-audit.yml`
  - Name: `Security - Audit & CodeQL`
  - Trigger: push to all branches, pull requests (opened, synchronize, reopened, ready_for_review), weekly schedule, manual dispatch
  - Purpose: dependency audit, CodeQL analysis, and dependency review

## Naming Conventions

- Workflow file names follow: `<domain>-<purpose>.yml`
- Workflow `name:` values are short and environment-aware.
- Job `name:` values are prefixed by context:
  - `CI ...`
  - `PR ...`
  - `Production ...`
  - `Staging ...`
  - `Security ...`

## Concurrency Policy

All workflows define `concurrency` with `cancel-in-progress: true` to cancel stale runs when a newer commit/PR update arrives in the same scope.

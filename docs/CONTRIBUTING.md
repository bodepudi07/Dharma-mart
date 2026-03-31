# Contributing to Dharma Mart

Thank you for contributing.

## Scope

This repository contains:

- `Server` (Express + MongoDB)
- `Frontend` (React + Vite storefront)
- `Admin` (React + Vite dashboard)

## Setup

Follow [SETUP.md](./SETUP.md) before opening a PR.

## Branch and commits

Recommended workflow:

1. Create a feature/fix branch from `main`
2. Keep commits focused and readable
3. Open a PR with context and test notes

Suggested commit style:

```txt
type(scope): short description
```

Examples:

- `fix(orders): validate status transition for shipped orders`
- `docs(api): align cart endpoint behavior`

## Code expectations

- Follow existing patterns in each package
- Keep changes scoped to the task
- Update docs when behavior changes
- Avoid introducing secrets into tracked files

## Validation before PR

Run what exists in this repo today:

### Server

```bash
cd Server
npm run dev
```

### Frontend

```bash
cd Frontend
npm run lint
npm run build
```

### Admin

```bash
cd Admin
npm run lint
npm run build
```

Note: there is currently no automated test suite in place.

## PR checklist

- Explain what changed and why
- Include manual verification steps
- Include screenshots for UI changes (Frontend/Admin)
- Mention any migration or env updates
- Update relevant markdown docs

## Reporting issues

When filing a bug, include:

- Reproduction steps
- Expected vs actual behavior
- Logs/errors
- Environment details (OS, Node version, browser)

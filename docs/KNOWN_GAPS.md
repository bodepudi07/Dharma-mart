# Known Gaps

This document tracks major limitations in the current codebase.

## 1) Authentication and authorization are not wired

- Routes are currently open.
- Controllers reference `req.user?.id`, but no auth middleware sets `req.user`.

Impact:

- "Admin-only" operations are not protected.
- User-specific routes like `/api/orders/my-orders` are not reliable as-is.



## 3) Reviews endpoint depends on missing auth context

- `POST /api/products/:id/reviews` expects `req.user?.id`.

Impact:

- Review creation behavior is incomplete without auth integration.



## 5) No automated tests yet

- There is no implemented API/UI test suite in this repo.

Impact:

- Regression risk is higher for refactors and feature changes.



## Suggested priority order

1. Add auth middleware and protect admin routes.
2. Add smoke/integration test coverage.

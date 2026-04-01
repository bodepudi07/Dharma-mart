# Known Gaps

This document tracks current limitations and areas for future improvement in the Dharma Mart platform.

## 1) Test Coverage
- While basic unit tests have been introduced, a comprehensive end-to-end (E2E) test suite for the checkout flow and admin management is not yet fully implemented.
- **Impact**: Higher regression risk during large-scale refactors of the payment or order logic.

## 2) Payment Webhook Reliability
- In production environments, webhooks may fail due to network issues. A robust retry mechanism or manual reconciliation dashboard for "Pending" orders is not currently implemented.
- **Impact**: Some orders might remain in "Pending" status even after successful payment if the webhook is missed.

## 3) Frontend Cache Synchronization
- The frontend currently relies on standard fetching. While the backend is cached, the frontend doesn't have a sophisticated stale-while-revalidate or global state cache (like TanStack Query) implemented throughout.
- **Impact**: Slightly more network requests than purely necessary from the client-side.

---

## Completed Improvements (Recently Fixed)
- [x] **Authentication & Authorization**: JWT middleware is now correctly wired to all protected routes.
- [x] **Database Migration**: Successfully moved from MongoDB to Supabase/PostgreSQL for better relational data handling.
- [x] **Concurrency & Race Conditions**: Implemented two-pass stock validation to prevent overselling of products.
- [x] **Performance**: Added server-side caching for read-heavy endpoints.

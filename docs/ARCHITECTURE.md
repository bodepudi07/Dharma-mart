# Dharma Mart Architecture

This document describes the current architecture of the Dharma Mart platform.

## High-Level View

```txt
Frontend (React/Vite)  ----\
                            >  Server (Express API)  ----  Supabase (PostgreSQL)
Admin (React/Vite)     ----/           |
                                       |-- Node-Cache (In-memory caching)
                                       |-- Cloudinary (Media uploads)
                                       `-- Cashfree (Payments)
```

## Internal Components

### 1. Frontend & Admin (React + Vite)
- **Frontend**: Customer-facing store with product browsing, cart management, and checkout.
- **Admin**: Internal dashboard for managing categories, products, vendors, and orders.
- Both use `Vite` for fast development and standard React patterns for state management.

### 2. Server (Node.js + Express)
The backend follows a modular structure:
- **Routes**: Define the API endpoints and wire up middleware.
- **Controllers**: Contain the business logic for each request.
- **Models**: Thin query helpers that interface with Supabase (replacing Mongoose).
- **Middlewares**: Handle authentication (JWT), error handling, and image uploads (Multer).
- **Services**: Wrappers for external integrations like Cloudinary and Cashfree.
- **Utils**: Generic helpers, including `cache.js` for performance optimization.

### 3. Persistence & Caching
- **Database**: Supabase provides a hosted PostgreSQL instance. Relations are strictly defined via SQL schemas.
- **Caching**: `node-cache` is used in a "cache-aside" pattern for high-traffic read operations (Product listing, Categories). The cache is automatically invalidated when data is mutated.

## Core Data Flow

### Request Authentication
1. Client sends a request with a Bearer Token in the `Authorization` header.
2. `authMiddleware.js` verifies the JWT.
3. User data is fetched from Supabase and attached to the `req.user` object.
4. Role-based checks (`authorize('admin')`) ensure only authorized users access certain routes.

### Product Reading (with Caching)
1. Controller checks the cache for a specific key (e.g., `products:list:...`).
2. If match found (Cache Hit), returns data immediately.
3. If no match (Cache Miss), fetches data from Supabase, updates cache, and then returns.

### Order Placement (Reliability)
1. Server performs a **two-pass validation**:
   - **Pass 1**: Checks stock levels for all items in the request.
   - **Pass 2**: Atomically decrements stock and creates the order record in Supabase.
2. This prevents race conditions and ensures data integrity.

## Tech Stack Summary

| Layer | Technology |
|---|---|
| **Language** | JavaScript (Node.js) |
| **Framework** | Express 5 |
| **Database** | PostgreSQL (Supabase) |
| **Cache** | Node-Cache |
| **Storage** | Cloudinary |
| **Payment** | Cashfree PG |
| **Auth** | JWT (JSON Web Tokens) |

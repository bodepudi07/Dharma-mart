# Dharma Mart API Reference

This document reflects the current server implementation. All routes are prefixed with `/api`.

## Base URLs

- **Local API base**: `http://localhost:8080/api`
- **Health check**: `http://localhost:8080/health`

## Authentication & Authorization

The API uses **JWT-based authentication**. Most protected routes require a `Bearer <token>` in the `Authorization` header.

| Role | Access Level |
|---|---|
| **Guest** | Browse products, categories, and manage a local cart via `sessionId`. |
| **User** | authenticated access to personal profile and order history. |
| **Admin** | Full access to management endpoints (CRUD categories, products, vendors, and orders). |

---

## Auth Endpoints (`/auth`)

### `POST /api/auth/register`
Registers a new user.
- **Body**: `{ name, email, password }`
- **Response**: `{ success, data: { user, token } }`

### `POST /api/auth/login`
Authenticates a user.
- **Body**: `{ email, password }`
- **Response**: `{ success, data: { user, token } }`

### `GET /api/auth/me`
Returns the current authenticated user's profile.
- **Header**: `Authorization: Bearer <token>`

---

## Categories (`/categories`)

### `GET /api/categories` [Cached]
Returns a list of categories.
- **Query Params**: `status` (active/inactive), `parentId`

### `POST /api/categories` [Admin Only]
Creates a new category. Invalidates the category cache.

---

## Products (`/products`)

### `GET /api/products` [Cached]
Returns a paginated list of products with filters.
- **Query Params**: `page`, `limit`, `category`, `vendor`, `minPrice`, `maxPrice`, `search`, `sort`, `isFeatured`, `isNewArrival`, `isBestSeller`.

### `GET /api/products/:id` [Cached]
Returns a single product by ID or slug.

### `POST /api/products` [Admin Only]
Creates a new product. Invalidates the product cache.

### `PUT /api/products/:id` [Admin Only]
Updates an existing product. Invalidates the product and search cache.

### `DELETE /api/products/:id` [Admin Only]
Deletes a product. Invalidates the product and search cache.

---

## Cart (`/cart`)

### `GET /api/cart`
Returns the current cart for a `userId` (if authenticated) or `sessionId` (guest).

### `POST /api/cart/add`
Adds an item to the cart. Validates stock availability before adding.

---

## Orders (`/orders`)

### `POST /api/orders`
Creates a new order. 
- **Validation**: Performs two-pass stock validation to prevent race conditions.
- **Payment**: Returns a Cashfree payment session if using online payment.

### `GET /api/orders` [Admin Only]
Lists all orders with pagination and status filters.

### `PUT /api/orders/:id/status` [Admin Only]
Updates order status and adds an entry to the status history log.

---

## Performance & Caching

Certain read-only endpoints (Products, Categories) are cached in-memory using `node-cache`.
- **Product TTL**: 60 seconds (configurable via `CACHE_TTL_PRODUCTS`)
- **Category TTL**: 300 seconds (configurable via `CACHE_TTL_CATEGORIES`)
- **Invalidation**: Cache is automatically purged whenever relevant data is created, updated, or deleted.

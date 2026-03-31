# Dharma Mart Architecture

This document describes the architecture as currently implemented.

## High-Level View

```txt
Frontend (React/Vite)  ----\
                            >  Server (Express API)  ----  MongoDB (Mongoose)
Admin (React/Vite)     ----/
                                |-- Cloudinary (media uploads)
                                `-- Cashfree (payment order + verification)
```

## Applications

### Frontend (`Frontend/`)

Customer storefront with:

- Product listing and filters
- Product detail page
- Guest cart via generated `sessionId` in localStorage
- Checkout flow (Cashfree or COD)
- Order success page

Routing:

- `/`
- `/products`
- `/products/:id`
- `/cart`
- `/checkout`
- `/order-success`

### Admin (`Admin/`)

Internal dashboard with:

- Overview stats (products/categories/vendors/orders)
- Category CRUD
- Product CRUD
- Vendor CRUD + approve/reject
- Order list + status actions

Routing:

- `/`
- `/categories`
- `/products`
- `/vendors`
- `/orders`

### Server (`Server/`)

Node.js + Express API using:

- `app/routes/*` for endpoint registration
- `app/controllers/*` for business logic
- `app/models/*` for Mongoose schemas
- `app/services/*` for Cashfree and Cloudinary integrations
- `app/middlewares/*` for upload and error handling

Registered API modules:

- `/api/categories`
- `/api/products`
- `/api/vendors`
- `/api/cart`
- `/api/orders`

Global middleware:

- CORS
- Body parsers (JSON/urlencoded)
- Helmet
- Rate limiting
- Not-found + error handler

## Data Model Summary

Collections currently defined:

- `Category`
- `Product`
- `Vendor`
- `Cart`
- `Order`

Relationships:

- Product references Category and Vendor
- Order items reference Product and Vendor
- Cart items reference Product
- Category supports parent-child hierarchy

## Request/State Flow

### Product Browsing

1. Frontend/Admin requests `/api/products` (with filters/sort/pagination)
2. Controller builds Mongo query
3. Mongoose returns populated product docs
4. Client renders list/detail

### Guest Cart

1. Frontend generates `sessionId` and stores in localStorage
2. Cart endpoints use `sessionId` to find/create active cart
3. Cart pre-save hook recalculates subtotal and total items
4. Frontend re-renders cart summary from API response

### Order Placement

1. Checkout posts items and shipping details to `/api/orders`
2. Server validates products and stock, then creates `Order`
3. For online payments, server creates Cashfree order and returns payment session
4. Cart is cleared after order creation

## Runtime Configuration

Key environment variables consumed by code:

- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `CORS_ORIGINS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`
- `FRONTEND_URL`
- `API_URL`

Frontend/Admin:

- `VITE_API_URL`

## Current Gaps and Risks

- No authentication/authorization middleware on routes
- Controllers that rely on `req.user` are partially ineffective
- No automated tests in repository
- Cashfree service default `notify_url` path does not match registered webhook route

## Future Evolution Areas

- Add auth and role-based route protection
- Add automated tests for API and UI
- Fix webhook URL path consistency and payment state lifecycle
- Add observability (structured logs + error tracking + request metrics)

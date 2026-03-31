# Dharma Mart API Reference

This document reflects the current server implementation in `Server/app/routes` and controllers.

## Base URLs

- Local API base: `http://localhost:8080/api`
- Health check: `http://localhost:8080/health`

## Authentication Status

There is currently no auth middleware applied on routes.

- Many controllers read `req.user?.id`, but `req.user` is typically undefined.
- Endpoints labeled as "admin" are not protected yet.

## Common Response Shapes

Success:

```json
{
  "success": true,
  "data": {}
}
```

Paginated:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## Health and Root

### `GET /health`

Returns process health, timestamp, and uptime.

### `GET /api`

Returns a basic API welcome object.

## Categories

### `GET /api/categories`

Query params:

- `page` (default `1`)
- `limit` (default `50`)
- `parentOnly` (`true` or `false`)
- `includeInactive` (`true` or `false`)
- `search` (name search)

### `GET /api/categories/tree`

Returns nested active categories.

### `GET /api/categories/:id`

`id` can be Mongo ObjectId or category slug.

### `POST /api/categories`

Create category. Uses multipart parser with optional file field:

- `image`: category image

Body fields:

- `name` (required)
- `description`
- `parentCategory`
- `customFields`
- `isActive`
- `sortOrder`

### `PUT /api/categories/:id`

Update category by ObjectId. Optional `image` file supported.

### `DELETE /api/categories/:id`

Deletes category if it has no subcategories.

## Products

### `GET /api/products`

Query params:

- `page` (default `1`)
- `limit` (default `20`)
- `category`
- `vendor`
- `minPrice`
- `maxPrice`
- `status` (default `active`, use `all` to disable status filter)
- `isFeatured`
- `isNewArrival`
- `isBestSeller`
- `search`
- `sort` (example: `-createdAt`, `price`, `-price`)
- `tags` (comma separated)

### `GET /api/products/featured`

Query params:

- `limit` (default `10`)

### `GET /api/products/new-arrivals`

Query params:

- `limit` (default `10`)

### `GET /api/products/best-sellers`

Query params:

- `limit` (default `10`)

### `GET /api/products/:id`

`id` can be Mongo ObjectId or product slug.

### `POST /api/products`

Create product (multipart form-data). File fields:

- `mainImage` (max 1)
- `gallery` (max 10)

Typical body fields:

- `name` (required)
- `description` (required)
- `shortDescription`
- `price` (required)
- `comparePrice`
- `category` (required)
- `vendor`
- `status`
- `isFeatured`
- `isNewArrival`
- `isBestSeller`
- `tags`
- `stock`

### `PUT /api/products/:id`

Update product by ObjectId (same multipart format as create).

### `DELETE /api/products/:id`

Delete product and attempt Cloudinary cleanup.

### `POST /api/products/:id/reviews`

Adds review. Controller expects `req.user?.id`; without auth middleware, this endpoint is currently not reliable.

## Vendors

### `GET /api/vendors`

Query params:

- `page` (default `1`)
- `limit` (default `20`)
- `status` (use `all` to disable status filter)
- `isVerified`
- `search`
- `sort` (default `-createdAt`)

### `GET /api/vendors/:id`

`id` can be Mongo ObjectId or vendor slug.

### `GET /api/vendors/:id/products`

`id` must be vendor ObjectId in current implementation.

Query params:

- `page`
- `limit`
- `status`

### `POST /api/vendors`

Create vendor (multipart form-data). Optional file fields:

- `logo`
- `banner`
- `documents`

### `PUT /api/vendors/:id`

Update vendor by ObjectId (multipart form-data).

### `DELETE /api/vendors/:id`

Delete vendor if there are no products linked to it.

### `PATCH /api/vendors/:id/approve`

Sets vendor status to `approved` and `isVerified` to `true`.

### `PATCH /api/vendors/:id/reject`

Request body:

```json
{
  "reason": "..."
}
```

## Cart

Cart works primarily via guest `sessionId`.

### `GET /api/cart`

Query params:

- `sessionId` (required for guest flow)

### `POST /api/cart/add`

```json
{
  "productId": "PRODUCT_ID",
  "quantity": 1,
  "sessionId": "SESSION_ID",
  "variant": null
}
```

### `PUT /api/cart/update`

```json
{
  "productId": "PRODUCT_ID",
  "quantity": 2,
  "sessionId": "SESSION_ID",
  "variant": null
}
```

### `POST /api/cart/remove`

```json
{
  "productId": "PRODUCT_ID",
  "sessionId": "SESSION_ID",
  "variant": null
}
```

### `POST /api/cart/clear`

```json
{
  "sessionId": "SESSION_ID"
}
```

### `POST /api/cart/coupon`

Currently returns `501` with "Coupon functionality not implemented yet".

## Orders

### `GET /api/orders`

Returns all orders with pagination (intended for admin, currently not protected).

Query params:

- `page` (default `1`)
- `limit` (default `10`)
- `status`
- `search` (order number or guest email)

### `POST /api/orders`

Create order.

```json
{
  "items": [
    { "productId": "PRODUCT_ID", "quantity": 1, "variant": null }
  ],
  "shippingAddress": {
    "fullName": "Name",
    "phone": "9999999999",
    "email": "name@example.com",
    "street": "Street",
    "city": "City",
    "state": "State",
    "country": "India",
    "zipCode": "000000"
  },
  "paymentMethod": "cashfree",
  "customerDetails": {
    "email": "name@example.com",
    "name": "Name",
    "phone": "9999999999"
  },
  "sessionId": "SESSION_ID"
}
```

Server currently applies:

- GST: `18%`
- Shipping: `0` if subtotal `>= 500`, else `50`

### `GET /api/orders/my-orders`

Controller filters by `req.user?.id`. Without auth middleware, this endpoint is not currently useful.

### `GET /api/orders/:id`

`id` can be order ObjectId or `orderNumber`.

### `PUT /api/orders/:id/status`

Updates order status. Transition validation is enforced.

Allowed transitions:

- `pending` -> `confirmed | cancelled`
- `confirmed` -> `processing | cancelled`
- `processing` -> `shipped | cancelled`
- `shipped` -> `delivered`
- `delivered` -> `returned`
- `returned` -> `refunded`

### `POST /api/orders/:id/cancel`

Cancels eligible order and restores stock.

### `POST /api/orders/verify-payment`

Verifies payment status using Cashfree order lookup.

### `POST /api/orders/webhook`

Cashfree webhook endpoint with signature verification.

## Upload Limits

Defined in `Server/app/middlewares/upload.js`:

- Default max file size: `10MB`
- Product and category image helpers use `5MB`
- Allowed image types: `jpeg`, `jpg`, `png`, `gif`, `webp`
- Allowed document types: `pdf`, `doc`, `docx`

## Rate Limiting and Security

- Helmet enabled
- Rate limit enabled (`100` requests per `15` minutes)
- CORS origin list from `CORS_ORIGINS` (comma separated), fallback to `http://localhost:5173` and `http://localhost:5174`

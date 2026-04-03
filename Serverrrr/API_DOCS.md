# 🚀 Dharma Mart API Documentation

> **Base URL**: `http://localhost:8080/api`
> **Version**: 1.0.0

---

## 📋 Table of Contents

- [Authentication](#authentication)
- [Categories](#categories)
- [Products](#products)
- [Orders](#orders)
- [Payments](#payments)
- [Error Handling](#error-handling)
- [Authentication Headers](#authentication-headers)
- [Data Models](#data-models)

---

## 🔐 Authentication

### Login

Authenticates an admin user and returns a JWT token.

**Endpoint**: `POST /api/auth/login`

**Access**: Public

#### Request Body

```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

| Field    | Type   | Required | Description           |
|----------|--------|----------|-----------------------|
| email    | String | Yes      | Admin email address   |
| password | String | Yes      | Admin password        |

#### Response

**Success (200)**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "_id": "60d5ec49f1b2c72b9c8e4d3a",
      "email": "admin@example.com",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error (400)**

```json
{
  "success": false,
  "message": "Email and password are required"
}
```

**Error (401)**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## 📁 Categories

### Get All Categories

Returns a list of all categories.

**Endpoint**: `GET /api/categories`

**Access**: Public

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec49f1b2c72b9c8e4d3a",
      "name": "Electronics",
      "slug": "electronics",
      "fields": [
        {
          "name": "brand",
          "type": "string",
          "required": true,
          "options": [],
          "defaultValue": null
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Single Category

**Endpoint**: `GET /api/categories/:id`

**Access**: Public

#### URL Parameters

| Parameter | Type   | Description  |
|-----------|--------|--------------|
| id        | String | Category ID  |

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b9c8e4d3a",
    "name": "Electronics",
    "slug": "electronics",
    "fields": [...],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error (404)**

```json
{
  "success": false,
  "message": "Category not found"
}
```

### Create Category

**Endpoint**: `POST /api/categories`

**Access**: Admin Only

#### Request Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body

```json
{
  "name": "Electronics",
  "fields": [
    {
      "name": "brand",
      "type": "string",
      "required": true
    },
    {
      "name": "warranty",
      "type": "number",
      "required": false,
      "defaultValue": 12
    },
    {
      "name": "color",
      "type": "select",
      "required": true,
      "options": ["Black", "White", "Silver"]
    }
  ]
}
```

| Field  | Type  | Required | Description                          |
|--------|-------|----------|--------------------------------------|
| name   | String| Yes      | Category name (min 2 chars, unique)  |
| fields | Array | No       | Array of field definitions           |

#### Field Object

| Field        | Type    | Required | Description                                    |
|--------------|---------|----------|------------------------------------------------|
| name         | String  | Yes      | Field name (min 2 chars)                       |
| type         | String  | Yes      | Field type: string, number, boolean, select    |
| required     | Boolean | No       | Is field mandatory (default: false)            |
| options      | Array   | No       | Required when type is select                   |
| defaultValue | Mixed   | No       | Default value for the field                    |

#### Response

**Success (201)**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b9c8e4d3a",
    "name": "Electronics",
    "slug": "electronics",
    "fields": [...],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error (400)**

```json
{
  "success": false,
  "message": "Category validation failed"
}
```

### Update Category

**Endpoint**: `PUT /api/categories/:id`

**Access**: Admin Only

#### Request Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

#### URL Parameters

| Parameter | Type   | Description  |
|-----------|--------|--------------|
| id        | String | Category ID  |

#### Request Body

```json
{
  "name": "Updated Electronics",
  "fields": [...]
}
```

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b9c8e4d3a",
    "name": "Updated Electronics",
    "slug": "updated-electronics",
    "fields": [...],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:45:00.000Z"
  }
}
```

**Error (400)**

```json
{
  "success": false,
  "message": "Category not found"
}
```

### Delete Category

**Endpoint**: `DELETE /api/categories/:id`

**Access**: Admin Only

#### Request Headers

```
Authorization: Bearer <token>
```

#### URL Parameters

| Parameter | Type   | Description  |
|-----------|--------|--------------|
| id        | String | Category ID  |

#### Response

**Success (200)**

```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Error (404)**

```json
{
  "success": false,
  "message": "Category not found"
}
```

---

## 🛍️ Products

### Get All Products

Returns a paginated list of products with optional filters.

**Endpoint**: `GET /api/products`

**Access**: Public

#### Query Parameters

| Parameter  | Type   | Required | Description                              |
|------------|--------|----------|------------------------------------------|
| page       | Number | No       | Page number (default: 1)                 |
| limit      | Number | No       | Items per page (default: 10)             |
| categoryId | String | No       | Filter by category ID                    |
| search     | String | No       | Search in title and description          |
| minPrice   | Number | No       | Minimum price filter                     |
| maxPrice   | Number | No       | Maximum price filter                     |

#### Example Request

```
GET /api/products?page=1&limit=10&categoryId=60d5ec49f1b2c72b9c8e4d3a&minPrice=100&maxPrice=500
```

#### Response

**Success (200)**

```json
{
  "success": true,
  "products": [
    {
      "_id": "60d5ec49f1b2c72b9c8e4d3b",
      "title": "Wireless Bluetooth Headphones",
      "description": "High-quality wireless headphones with noise cancellation",
      "price": 299.99,
      "categoryId": {
        "_id": "60d5ec49f1b2c72b9c8e4d3a",
        "name": "Electronics",
        "slug": "electronics"
      },
      "dynamicFields": {
        "brand": "Sony",
        "warranty": 24,
        "color": "Black"
      },
      "images": [
        {
          "url": "https://res.cloudinary.com/demo/image/upload/v1234567890/product1.jpg",
          "public_id": "product1"
        }
      ],
      "vendor": {
        "name": "Sony Official",
        "contact": "support@sony.com"
      },
      "stock": 50,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "pages": 3
}
```

### Get Single Product

**Endpoint**: `GET /api/products/:id`

**Access**: Public

#### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | String | Product ID  |

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b9c8e4d3b",
    "title": "Wireless Bluetooth Headphones",
    "description": "High-quality wireless headphones",
    "price": 299.99,
    "categoryId": {
      "_id": "60d5ec49f1b2c72b9c8e4d3a",
      "name": "Electronics",
      "slug": "electronics",
      "fields": [...]
    },
    "dynamicFields": {...},
    "images": [...],
    "vendor": {...},
    "stock": 50,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error (404)**

```json
{
  "success": false,
  "message": "Product not found"
}
```

### Create Product

**Endpoint**: `POST /api/products`

**Access**: Admin Only

#### Request Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### Request Body (Form Data)

| Field         | Type     | Required | Description                                    |
|---------------|----------|----------|------------------------------------------------|
| title         | String   | Yes      | Product name (min 2 chars)                     |
| description   | String   | No       | Product description                            |
| price         | Number   | Yes      | Product price (>= 0)                           |
| categoryId    | String   | Yes      | Category ID                                    |
| dynamicFields | String   | No       | JSON string of dynamic field values            |
| vendor.name   | String   | No       | Vendor name                                    |
| vendor.contact| String   | No       | Vendor contact info                            |
| stock         | Number   | No       | Available quantity (default: 0)                |
| images        | File[]   | No       | Image files (max 5, max 5MB each)             |

#### Response

**Success (201)**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b9c8e4d3b",
    "title": "Wireless Bluetooth Headphones",
    "description": "High-quality wireless headphones",
    "price": 299.99,
    "categoryId": "60d5ec49f1b2c72b9c8e4d3a",
    "dynamicFields": {
      "brand": "Sony",
      "warranty": 24,
      "color": "Black"
    },
    "images": [
      {
        "url": "https://res.cloudinary.com/demo/image/upload/v1234567890/product1.jpg",
        "public_id": "product1"
      }
    ],
    "vendor": {
      "name": "Sony Official",
      "contact": "support@sony.com"
    },
    "stock": 50,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error (400)**

```json
{
  "success": false,
  "message": "Invalid category"
}
```

```json
{
  "success": false,
  "message": "brand is required"
}
```

### Update Product

**Endpoint**: `PUT /api/products/:id`

**Access**: Admin Only

#### Request Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | String | Product ID  |

#### Request Body (Form Data)

Same as Create Product - all fields are optional for updates.

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b9c8e4d3b",
    "title": "Updated Wireless Headphones",
    "description": "Updated description",
    "price": 349.99,
    ...
  }
}
```

**Error (404)**

```json
{
  "success": false,
  "message": "Product not found"
}
```

### Delete Product

Soft deletes a product (sets isActive to false) and removes images from Cloudinary.

**Endpoint**: `DELETE /api/products/:id`

**Access**: Admin Only

#### Request Headers

```
Authorization: Bearer <token>
```

#### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | String | Product ID  |

#### Response

**Success (200)**

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Error (404)**

```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## 📦 Orders

### Create Order

Creates a new order and reduces product stock.

**Endpoint**: `POST /api/orders`

**Access**: Public

#### Request Body

```json
{
  "items": [
    {
      "productId": "60d5ec49f1b2c72b9c8e4d3b",
      "quantity": 2
    },
    {
      "productId": "60d5ec49f1b2c72b9c8e4d3c",
      "quantity": 1
    }
  ],
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "address": {
    "line1": "123 Main Street",
    "line2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  }
}
```

| Field          | Type   | Required | Description                    |
|----------------|--------|----------|--------------------------------|
| items          | Array  | Yes      | Array of order items           |
| customer       | Object | No       | Customer details               |
| address        | Object | No       | Shipping address               |

#### Order Item Object

| Field     | Type   | Required | Description              |
|-----------|--------|----------|--------------------------|
| productId | String | Yes      | Product ID               |
| quantity  | Number | Yes      | Quantity (>= 1)          |

#### Customer Object

| Field | Type   | Required | Description    |
|-------|--------|----------|----------------|
| name  | String | No       | Customer name  |
| email | String | No       | Customer email |
| phone | String | No       | Customer phone |

#### Address Object

| Field      | Type   | Required | Description        |
|------------|--------|----------|--------------------|
| line1      | String | No       | Address line 1     |
| line2      | String | No       | Address line 2     |
| city       | String | No       | City               |
| state      | String | No       | State/Province     |
| postalCode | String | No       | Postal/ZIP code    |
| country    | String | No       | Country            |

#### Response

**Success (201)**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b9c8e4d3d",
    "orderId": "ORD_1705312200000_456",
    "items": [
      {
        "productId": "60d5ec49f1b2c72b9c8e4d3b",
        "title": "Wireless Bluetooth Headphones",
        "price": 299.99,
        "quantity": 2
      },
      {
        "productId": "60d5ec49f1b2c72b9c8e4d3c",
        "title": "USB-C Cable",
        "price": 19.99,
        "quantity": 1
      }
    ],
    "amount": 619.97,
    "status": "pending",
    "paymentSessionId": null,
    "paymentOrderId": null,
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "address": {
      "line1": "123 Main Street",
      "line2": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error (400)**

```json
{
  "success": false,
  "message": "Order must contain at least one item"
}
```

```json
{
  "success": false,
  "message": "Invalid product ID"
}
```

```json
{
  "success": false,
  "message": "Product not available"
}
```

```json
{
  "success": false,
  "message": "Insufficient stock for Wireless Bluetooth Headphones"
}
```

### Get Single Order

**Endpoint**: `GET /api/orders/:id`

**Access**: Public

#### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | String | Order ID    |

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b9c8e4d3d",
    "orderId": "ORD_1705312200000_456",
    "items": [...],
    "amount": 619.97,
    "status": "pending",
    "paymentSessionId": "session_abc123",
    "paymentOrderId": "order_xyz789",
    "customer": {...},
    "address": {...},
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error (404)**

```json
{
  "success": false,
  "message": "Order not found"
}
```

### Get All Orders (Admin)

Returns all orders sorted by creation date.

**Endpoint**: `GET /api/orders`

**Access**: Admin Only

#### Request Headers

```
Authorization: Bearer <token>
```

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec49f1b2c72b9c8e4d3d",
      "orderId": "ORD_1705312200000_456",
      "items": [...],
      "amount": 619.97,
      "status": "paid",
      "customer": {...},
      "address": {...},
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

### Update Order Status

Updates order status and payment information.

**Endpoint**: `POST /api/orders/status`

**Access**: Public

#### Request Body

```json
{
  "orderId": "ORD_1705312200000_456",
  "status": "paid",
  "paymentSessionId": "session_abc123",
  "paymentOrderId": "order_xyz789"
}
```

| Field            | Type   | Required | Description                                      |
|------------------|--------|----------|--------------------------------------------------|
| orderId          | String | Yes      | Order ID                                         |
| status           | String | Yes      | New status: pending, paid, failed                |
| paymentSessionId | String | No       | Payment session ID                               |
| paymentOrderId   | String | No       | Payment provider order ID                        |

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b9c8e4d3d",
    "orderId": "ORD_1705312200000_456",
    "status": "paid",
    "paymentSessionId": "session_abc123",
    "paymentOrderId": "order_xyz789",
    ...
  }
}
```

**Error (400)**

```json
{
  "success": false,
  "message": "Order not found"
}
```

---

## 💳 Payments

### Create Payment Session

Creates a Cashfree payment session for an order.

**Endpoint**: `POST /api/payments/create-session`

**Access**: Public

#### Request Body

```json
{
  "orderId": "ORD_1705312200000_456"
}
```

| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| orderId | String | Yes      | Order ID    |

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "payment_session_id": "session_abc123xyz",
    "order_id": "cf_order_789",
    "order_amount": 619.97,
    "order_currency": "INR",
    "order_status": "ACTIVE"
  }
}
```

**Error (400)**

```json
{
  "success": false,
  "message": "Order not found"
}
```

```json
{
  "success": false,
  "message": "Order already paid"
}
```

### Payment Webhook

Webhook endpoint for Cashfree payment notifications.

**Endpoint**: `POST /api/payments/webhook`

**Access**: Public (called by Cashfree)

#### Request Body (from Cashfree)

```json
{
  "order_id": "ORD_1705312200000_456",
  "order_status": "PAID",
  "payment_amount": 619.97,
  "payment_currency": "INR",
  "payment_time": "2024-01-15T10:35:00.000Z"
}
```

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b9c8e4d3d",
    "orderId": "ORD_1705312200000_456",
    "status": "paid",
    ...
  }
}
```

**Error (400)**

```json
{
  "success": false,
  "message": "Order not found"
}
```

---

## ❌ Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

### HTTP Status Codes

| Code | Description                                    |
|------|------------------------------------------------|
| 200  | Success                                        |
| 201  | Created                                        |
| 400  | Bad Request (validation error, missing fields) |
| 401  | Unauthorized (invalid or missing token)        |
| 403  | Forbidden (insufficient permissions)           |
| 404  | Not Found                                      |
| 500  | Internal Server Error                          |

---

## 🔑 Authentication Headers

For protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Protected Endpoints

| Endpoint                    | Method | Access Level |
|-----------------------------|--------|--------------|
| `/api/categories`           | POST   | Admin        |
| `/api/categories/:id`       | PUT    | Admin        |
| `/api/categories/:id`       | DELETE | Admin        |
| `/api/products`             | POST   | Admin        |
| `/api/products/:id`         | PUT    | Admin        |
| `/api/products/:id`         | DELETE | Admin        |
| `/api/orders`               | GET    | Admin        |

---

## 📊 Data Models

### Category Schema

```javascript
{
  name: String,           // Required, unique, min 2 chars
  slug: String,           // Auto-generated, unique, lowercase
  fields: [{
    name: String,         // Required, min 2 chars
    type: String,         // "string" | "number" | "boolean" | "select"
    required: Boolean,    // Default: false
    options: [String],    // Required when type is "select"
    defaultValue: Mixed   // Default value
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Product Schema

```javascript
{
  title: String,          // Required, min 2 chars
  description: String,    // Default: ""
  price: Number,          // Required, min 0
  categoryId: ObjectId,   // Required, ref: Category
  dynamicFields: Map,     // Key-value pairs matching category fields
  images: [{
    url: String,
    public_id: String
  }],
  vendor: {
    name: String,
    contact: String
  },
  stock: Number,          // Default: 0, min 0
  isActive: Boolean,      // Default: true
  createdAt: Date,
  updatedAt: Date
}
```

### Order Schema

```javascript
{
  orderId: String,        // Required, unique, auto-generated
  items: [{
    productId: ObjectId,  // Required, ref: Product
    title: String,        // Required (snapshot)
    price: Number,        // Required, min 0 (snapshot)
    quantity: Number      // Required, min 1
  }],
  amount: Number,         // Required, min 0 (auto-calculated)
  status: String,         // "pending" | "paid" | "failed"
  paymentSessionId: String,
  paymentOrderId: String,
  customer: {
    name: String,
    email: String,
    phone: String
  },
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Admin Schema

```javascript
{
  email: String,          // Required, unique, lowercase
  password: String,       // Required, min 6 chars, hashed
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚀 Quick Start Examples

### 1. Login and Get Token

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### 2. Create Category

```bash
curl -X POST http://localhost:8080/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "fields": [
      {"name": "brand", "type": "string", "required": true}
    ]
  }'
```

### 3. Create Product with Image

```bash
curl -X POST http://localhost:8080/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Wireless Headphones" \
  -F "price=299.99" \
  -F "categoryId=CATEGORY_ID" \
  -F "dynamicFields={\"brand\":\"Sony\"}" \
  -F "images=@/path/to/image.jpg"
```

### 4. Create Order

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId":"PRODUCT_ID","quantity":2}],
    "customer": {"name":"John","email":"john@example.com"}
  }'
```

### 5. Create Payment Session

```bash
curl -X POST http://localhost:8080/api/payments/create-session \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID"}'
```

---

## 📝 Notes

1. **Dynamic Fields**: Products use dynamic fields based on their category. Always fetch the category first to know what fields are available.

2. **Image Upload**: Products support up to 5 images, each max 5MB. Images are stored on Cloudinary.

3. **Stock Management**: Creating an order automatically reduces product stock. Ensure sufficient stock before ordering.

4. **Order Amount**: The order amount is automatically calculated from items. The server validates that the provided amount matches the calculated amount.

5. **Soft Delete**: Products are soft-deleted (isActive set to false) rather than permanently removed.

6. **Slug Generation**: Category slugs are auto-generated from the name (lowercase, hyphenated).

7. **Payment Integration**: Uses Cashfree for payment processing. The webhook endpoint handles payment status updates.

---

*Last Updated: 2024*
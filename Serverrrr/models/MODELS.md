# 📦 Models Documentation

This document describes all database models used in the application.

---

# 🛍️ Product Model

Represents items available for purchase.

## Fields

| Field                 | Type     | Description                          |
| --------------------- | -------- | ------------------------------------ |
| title                 | String   | Product name (min 2 chars, required) |
| description           | String   | Product description                  |
| price                 | Number   | Product price (>= 0, required)       |
| categoryId            | ObjectId | Reference to Category (required)     |
| dynamicFields         | Map      | Custom fields based on category      |
| images                | [String] | Array of image URLs                  |
| vendor.name           | String   | Vendor name                          |
| vendor.contact        | String   | Vendor contact info                  |
| stock                 | Number   | Available quantity                   |
| isActive              | Boolean  | Product visibility                   |
| createdAt / updatedAt | Date     | Auto timestamps                      |

## Indexes

* Text index: `title`, `description`
* `categoryId`
* `price`

## Special Features

### 🔥 Dynamic Fields

* Fields depend on category
* Stored as key-value pairs
* Validated before saving

### ✅ Validation Rules

* Must match category field definitions
* Enforces:
  * Required fields
  * Type checking
  * Select options validation
  * Unknown field rejection

---

# 🗂️ Category Model

Defines product categories and their dynamic fields.

## Fields

| Field                 | Type   | Description                       |
| --------------------- | ------ | --------------------------------- |
| name                  | String | Category name (unique, required)  |
| slug                  | String | URL-friendly identifier           |
| fields                | Array  | List of dynamic field definitions |
| createdAt / updatedAt | Date   | Auto timestamps                   |

---

## Field Schema (Dynamic Fields)

| Field        | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| name         | String   | Field name                                   |
| type         | Enum     | `string`,`number`,`boolean`,`select` |
| required     | Boolean  | Is field mandatory                           |
| options      | [String] | Required for `select`type                  |
| defaultValue | Mixed    | Default value                                |

---

## Features

### 🔹 Auto Slug Generation

* Generated from name
* Lowercase + hyphenated

### 🔹 Field Validation

* Unique field names (case-insensitive)
* `select` must have options

---

# 👨‍💼 Admin Model

Represents admin users.

## Fields

| Field                 | Type   | Description     |
| --------------------- | ------ | --------------- |
| email                 | String | Unique email    |
| password              | String | Hashed password |
| createdAt / updatedAt | Date   | Auto timestamps |

---

## Features

### 🔐 Security

* Password hashed using bcrypt
* Password excluded from queries (`select: false`)

### 🔑 Methods

#### comparePassword(candidatePassword)

* Compares plain password with hashed password

#### toJSON()

* Removes password from API responses

---

# 📦 Order Model

Represents customer orders.

## Fields

| Field                 | Type   | Description                     |
| --------------------- | ------ | ------------------------------- |
| orderId               | String | Unique order identifier         |
| items                 | Array  | List of purchased items         |
| amount                | Number | Total order amount              |
| status                | Enum   | `pending`,`paid`,`failed` |
| paymentSessionId      | String | Payment session reference       |
| paymentOrderId        | String | Payment provider order ID       |
| customer              | Object | Customer details                |
| address               | Object | Shipping address                |
| createdAt / updatedAt | Date   | Auto timestamps                 |

---

## Order Item Schema

| Field     | Type     | Description              |
| --------- | -------- | ------------------------ |
| productId | ObjectId | Reference to Product     |
| title     | String   | Snapshot of product name |
| price     | Number   | Snapshot of price        |
| quantity  | Number   | Quantity purchased       |

---

## Features

### 💰 Amount Validation

* Total is recalculated before saving
* Prevents tampering

### 📊 Indexes

* `orderId`
* `status`
* `createdAt`
* `customer.email`

---

# 🔗 Relationships Overview

* Product → Category (Many-to-One)
* Order → Product (via items)
* Admin → مستقل (no direct relation)

---

# 🚀 Summary

* Flexible product system using dynamic fields
* Strong validation at schema level
* Secure admin authentication
* Reliable order integrity checks

---

# 🧠 Future Improvements (Optional)

* Add product variants (size, color)
* Add order statuses (cancelled, refunded)
* Add role-based admin system
* Add soft deletes (`isDeleted` flag)

---

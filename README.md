# Dharma Mart

Dharma Mart is a monorepo e-commerce project with:

- `Frontend`: customer storefront (React + Vite)
- `Admin`: admin dashboard (React + Vite)
- `Server`: REST API (Node.js + Express + Supabase [PostgreSQL])

## Tech Stack

- **Persistence**: Supabase (PostgreSQL)
- **Caching**: Node-Cache (In-memory)
- **Authentication**: JWT-based with Role-Based Access Control (RBAC)
- **Media**: Cloudinary for images
- **Payments**: Cashfree PG integration

## Current Status

- [x] **Database Migration**: Fully migrated from MongoDB to Supabase.
- [x] **Caching**: Implemented in-memory caching for products and categories.
- [x] **Bug Fixes**: Out-of-stock validation on checkout is now robust (two-pass validation).
- [x] **Security**: Admin routes are protected by JWT authentication.
- [x] **Core Features**: Category, product, vendor, cart, and order APIs are operational.
- [x] **Admin**: CRUD screens for all entities with secure order management.

## Project Layout

```txt
dharma-mart/
|-- Frontend/
|-- Admin/
|-- Server/
`-- docs/
```

## Quick Start

1. **Install dependencies**
   ```bash
   cd Server && npm install
   cd ../Frontend && npm install
   cd ../Admin && npm install
   ```

2. **Step-by-step Setup**
   Please see the [Setup Guide](docs/SETUP.md) for detailed instructions on configuring Supabase and other services.

3. **Running the Applications**
   ```bash
   # Terminal 1 (Server)
   cd Server && npm run dev

   # Terminal 2 (Frontend)
   cd Frontend && npm run dev

   # Terminal 3 (Admin)
   cd Admin && npm run dev
   ```

4. **Access Links**
   - Frontend: `http://localhost:5173`
   - Admin: `http://localhost:5174`
   - API Summary: `http://localhost:8080/api`
   - Health Check: `http://localhost:8080/health`

## Documentation

- [Docs Index](docs/README.md)
- [Architecture & Tech Stack](docs/ARCHITECTURE.md)
- [Database Schema (SQL)](Server/migrations/001_initial_schema.sql)
- [API Reference](docs/API.md)
- [Setup guide](docs/SETUP.md)
- [Environment variables](docs/ENVIRONMENT.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Contributing](docs/CONTRIBUTING.md)

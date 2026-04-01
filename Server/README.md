# Server (Backend API)

Node.js (Express) backend for Dharma Mart, powered by Supabase (PostgreSQL).

## Stack

- **Node.js**: ES Modules
- **Express**: Framework for handling REST API requests
- **Database**: Supabase (PostgreSQL)
- **Caching**: Node-Cache (In-memory)
- **Authentication**: JWT-based with Role-Based Access Control
- **Media**: Cloudinary (Image uploads)
- **Payments**: Cashfree PG integration

## Scripts

```bash
npm run dev    # Start with nodemon (development)
npm start      # Start with node (production)
npm test       # Run automated tests (Jest)
```

## Environment (`Server/.env`)

Required variables for development:

```env
PORT=8080
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Auth
JWT_SECRET=your-random-secret-key

# Services
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CASHFREE_APP_ID=...
CASHFREE_SECRET_KEY=...

# Cache TTLs (seconds)
CACHE_TTL_PRODUCTS=60
CACHE_TTL_CATEGORIES=300
```

## Database Setup

Dharma Mart uses Supabase for database persistence. 

1. Create a [Supabase](https://supabase.com/) project.
2. Run the initial SQL schema found in `migrations/001_initial_schema.sql` inside the Supabase SQL Editor.
3. Add your Supabase credentials to the `.env` file.

## API Modules

- `/api/auth`: Login, Register, Profile
- `/api/categories`: Category management (Cached)
- `/api/products`: Product catalog with filters (Cached)
- `/api/vendors`: Vendor management
- `/api/cart`: Shopping cart management
- `/api/orders`: Order placement, tracking, and management

## Folder Structure

```txt
Server/
|-- app/
|   |-- controllers/ # Request logic
|   |-- middlewares/ # Auth, Error, Upload
|   |-- models/      # Supabase query helpers
|   |-- routes/      # Endpoint definitions
|   |-- services/    # External integrations (Cashfree, Cloudinary)
|   `-- utils/       # Cache, generic utilities
|-- migrations/      # SQL schema files
|-- supabase.js      # Supabase client singleton
|-- config.js        # Server configuration & initialization
`-- server.js        # Entry point
```

## Related Docs

- [Setup Guide](../docs/SETUP.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [API Reference](../docs/API.md)
- [Environment Variables](../docs/ENVIRONMENT.md)

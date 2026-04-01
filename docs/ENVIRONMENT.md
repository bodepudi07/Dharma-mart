# Environment Variables

This document lists the environment variables used across the Dharma Mart platform.

## Server (`Server/.env`)

### Database (Supabase)
Dharma Mart has migrated from MongoDB to Supabase. These variables are now **REQUIRED**.
- `SUPABASE_URL`: The URL for your Supabase project (e.g., `https://xyz.supabase.co`).
- `SUPABASE_SERVICE_KEY`: The **service_role** secret key found in your Supabase project settings.

### Authentication
- `JWT_SECRET`: A long, random string used to sign JSON Web Tokens. **REQUIRED** for auth.

### Caching
- `CACHE_TTL_PRODUCTS`: Time-to-live for product cache in seconds (Default: `60`).
- `CACHE_TTL_CATEGORIES`: Time-to-live for category cache in seconds (Default: `300`).

### External Services
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for image uploads.
- `CLOUDINARY_API_KEY`: Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Cloudinary API secret.
- `CASHFREE_APP_ID`: Cashfree App ID for payments.
- `CASHFREE_SECRET_KEY`: Cashfree Secret Key for payments.

### Networking & Security
- `PORT`: Server port (Default: `8080`).
- `NODE_ENV`: Current environment (`development`, `production`, `test`).
- `CORS_ORIGINS`: Comma-separated list of allowed origins (e.g., `http://localhost:5173,http://localhost:5174`).
- `API_RATE_LIMIT_WINDOW`: Rate limiting window in milliseconds (Default: `900000` - 15m).
- `API_RATE_LIMIT_MAX`: Max requests per window (Default: `100`).

---

## Frontend (`Frontend/.env`)
- `VITE_API_URL`: Root URL for the Backend API (e.g., `http://localhost:8080/api`).

---

## Admin (`Admin/.env`)
- `VITE_API_URL`: Root URL for the Backend API (e.g., `http://localhost:8080/api`).

---

## Local Development Tips
- Ensure each subdirectory contains its own `.env` file based on the `.env.example` provided.
- Restart the server after changing any environment variables.

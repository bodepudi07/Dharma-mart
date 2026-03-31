# Environment Variables

This file documents environment variables currently consumed by the code.

## Server (`Server/.env`)

### Required

- `MONGODB_URI`
  - Used by `Server/db.js`
  - Example: `mongodb://localhost:27017/dharma-mart`

### Strongly recommended

- `PORT`
  - Used by `Server/server.js`
  - Default if missing: `8080`

- `NODE_ENV`
  - Used in startup/error logging behavior
  - Typical values: `development` or `production`

- `CORS_ORIGINS`
  - Used by `Server/app/app.js`
  - Comma-separated list
  - Example: `http://localhost:5173,http://localhost:5174`

### Required for image uploads

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
  - Used by `Server/app/services/cloudinaryService.js`

### Required for online payments

- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`
  - Used by `Server/app/services/cashfreeService.js`

### URL helpers for payment redirects/webhooks

- `FRONTEND_URL`
  - Used to construct default Cashfree return URL
  - Fallback if missing: `http://localhost:5173`

- `API_URL`
  - Used to construct default Cashfree notify URL
  - Fallback if missing: `http://localhost:8080`

### Rate Limiting

- `API_RATE_LIMIT_WINDOW`
  - Window in milliseconds
  - Default: `900000` (15 minutes)

- `API_RATE_LIMIT_MAX`
  - Max requests per window
  - Default: `100`

## Frontend (`Frontend/.env`)

- `VITE_API_URL`
  - Used for all API calls
  - Example: `http://localhost:8080/api`

## Admin (`Admin/.env`)

- `VITE_API_URL`
  - Used for all API calls
  - Example: `http://localhost:8080/api`

## Notes

- Keep secrets out of git.
- `.env.example` files are provided in each sub-directory for initialization.

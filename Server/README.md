# Server (Backend API)

Express + MongoDB backend for Dharma Mart.

## Stack

- Node.js (ES modules)
- Express 5
- Mongoose
- Cloudinary (uploads)
- Cashfree PG (payments)

## Scripts

```bash
npm run dev    # nodemon server.js
npm start      # node server.js
```

## Environment (`Server/.env`)

```env
PORT=8080
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/dharma-mart
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Optional but needed for full feature set
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=

FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:8080
```

## Run locally

```bash
cd Server
npm install
npm run dev
```

Health check:

- `GET http://localhost:8080/health`

API root:

- `GET http://localhost:8080/api`

## API modules

- `/api/categories`
- `/api/products`
- `/api/vendors`
- `/api/cart`
- `/api/orders`

## Folder structure

```txt
Server/
|-- app/
|   |-- controllers/
|   |-- middlewares/
|   |-- models/
|   |-- routes/
|   `-- services/
|-- config.js
|-- db.js
`-- server.js
```

## Notes

- Auth middleware is not wired yet; routes are currently open.
- Rate limiting and helmet are enabled globally.
- Upload handling uses multer memory storage and Cloudinary upload.

## Related docs

- [Setup](../docs/SETUP.md)
- [API](../docs/API.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [Environment](../docs/ENVIRONMENT.md)
- [Known Gaps](../docs/KNOWN_GAPS.md)

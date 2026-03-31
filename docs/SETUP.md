# Dharma Mart Setup Guide

This setup guide is based on the current repository structure and scripts.

## Prerequisites

- Node.js 20+ recommended
- npm
- MongoDB (local or Atlas)

Optional for full functionality:

- Cloudinary account (image uploads)
- Cashfree test account (online payment flow)

## 1) Clone and install

```bash
git clone https://github.com/KRISHNA-12082006/dharma-mart.git
cd dharma-mart

cd Server && npm install
cd ../Frontend && npm install
cd ../Admin && npm install
```

## 2) Configure environment files

Note: the repo currently does not include `.env.example` files.

### Server (`Server/.env`)

```env
PORT=8080
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/dharma-mart

CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Optional but needed for uploads/payments
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=

FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:8080
```

### Frontend (`Frontend/.env`)

```env
VITE_API_URL=http://localhost:8080/api
```

### Admin (`Admin/.env`)

```env
VITE_API_URL=http://localhost:8080/api
```

## 3) Start all services

Use three terminals:

Terminal 1:

```bash
cd Server
npm run dev
```

Terminal 2:

```bash
cd Frontend
npm run dev
```

Terminal 3:

```bash
cd Admin
npm run dev
```

## 4) Verify locally

- API health: `http://localhost:8080/health`
- API root: `http://localhost:8080/api`
- Frontend: `http://localhost:5173`
- Admin: `http://localhost:5174`

Quick API checks:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/products
curl http://localhost:8080/api/categories
```

## Troubleshooting

### MongoDB connection error

- Ensure MongoDB is running
- Verify `MONGODB_URI` (not `MONGO_URI`)
- Restart server after env changes

### CORS errors

- Confirm `CORS_ORIGINS` includes frontend/admin origins
- Restart server after updating `.env`

### Upload errors

- Validate Cloudinary keys
- Ensure file type and size match server limits

### Payment webhook mismatch

Current code registers webhook at `/api/orders/webhook` but payment service builds `notify_url` with `/api/payments/webhook`. This should be aligned in code before production payment rollout.

## Scripts reference

### Server

- `npm run dev` -> `npx nodemon server.js`
- `npm start` -> `node server.js`

### Frontend/Admin

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## Related docs

- [Environment Variables](./ENVIRONMENT.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Known Gaps](./KNOWN_GAPS.md)

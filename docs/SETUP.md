# Dharma Mart Setup Guide

This setup guide provides step-by-step instructions for getting Dharma Mart running locally.

## Prerequisites

- **Node.js 20+** (ESM support required)
- **npm** (for package management)
- **Supabase Account** (for hosted PostgreSQL database)

Optional for full functionality:
- **Cloudinary account** (image uploads)
- **Cashfree account** (test mode for payments)

---

## 1) Clone and Install

```bash
git clone https://github.com/KRISHNA-12082006/dharma-mart.git
cd dharma-mart

# Install Server dependencies
cd Server && npm install

# Install Frontend dependencies
cd ../Frontend && npm install

# Install Admin dependencies
cd ../Admin && npm install
```

## 2) Database Setup (Supabase)

Dharma Mart uses Supabase for database persistence.

1.  Log in to [Supabase](https://supabase.com/).
2.  Create a new project (e.g., `dharma-mart`).
3.  Once the project is ready, navigate to the **SQL Editor** in the sidebar.
4.  Copy the contents of `Server/migrations/001_initial_schema.sql` and paste it into the SQL Editor.
5.  Run the script to create the necessary tables, indexes, and relationships.

## 3) Configure Environment Variables

Create `.env` files in each service directory based on the following templates.

### Server (`Server/.env`)

```env
PORT=8080
NODE_ENV=development

# Supabase Credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# JWT Secret for Auth
JWT_SECRET=your-random-secure-secret

# API Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Optional: Cloudinary for uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional: Cashfree for payments
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=

# Cache Settings (Seconds)
CACHE_TTL_PRODUCTS=60
CACHE_TTL_CATEGORIES=300
```

### Frontend (`Frontend/.env`)

```env
VITE_API_URL=http://localhost:8080/api
```

### Admin (`Admin/.env`)

```env
VITE_API_URL=http://localhost:8080/api
```

---

## 4) Start Services

Run each service in a separate terminal:

### Terminal 1: Server
```bash
cd Server
npm run dev
```

### Terminal 2: Frontend
```bash
cd Frontend
npm run dev
```

### Terminal 3: Admin
```bash
cd Admin
npm run dev
```

---

## 5) Verify Installation

- **API Health**: `http://localhost:8080/health` (Should return OK)
- **API Summary**: `http://localhost:8080/api`
- **Frontend**: Check `http://localhost:5173`
- **Admin**: Check `http://localhost:5174`

---

## Troubleshooting

### Database Connection Failed
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `Server/.env`.
- Ensure the SQL migration was successfully executed in the Supabase dashboard.

### Caching Issues
- Caching is managed in-memory via `node-cache`. If you need to see live updates immediately, you can temporarily set `CACHE_TTL_PRODUCTS=0` in your env or restart the server.

### CORS Errors
- Confirm that `CORS_ORIGINS` includes both the Frontend and Admin URLs.
- Note that any change to `.env` requires a server restart.

## Related docs

- [Environment Variables](./ENVIRONMENT.md)
- [Architecture & Tech Stack](./ARCHITECTURE.md)
- [API Reference](./API.md)

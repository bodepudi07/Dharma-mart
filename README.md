# Dharma Mart

Dharma Mart is a monorepo e-commerce project with:

- `Frontend`: customer storefront (React + Vite)
- `Admin`: admin dashboard (React + Vite)
- `Server`: REST API (Node.js + Express + MongoDB)

## Current Status

Implemented in code today:

- Category, product, vendor, cart, and order APIs
- Frontend product browsing, cart, checkout, and order success flow
- Admin CRUD screens for categories/products/vendors and order status actions
- Cloudinary upload support and Cashfree SDK integration

Important current constraints:

- No authentication middleware is wired yet (`req.user` is usually undefined)
- No automated test suite is implemented
- No `.env.example` file is present
- Cashfree webhook URL generation in service code points to `/api/payments/webhook`, while the actual webhook route is `/api/orders/webhook`

## Project Layout

```txt
dharma-mart/
|-- Frontend/
|-- Admin/
|-- Server/
`-- docs/
```

## Quick Start

1. Install dependencies
```bash
cd Server && npm install
cd ../Frontend && npm install
cd ../Admin && npm install
```

2. Create environment files

- `Server/.env`
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

- `Frontend/.env`
```env
VITE_API_URL=http://localhost:8080/api
```

- `Admin/.env`
```env
VITE_API_URL=http://localhost:8080/api
```

3. Run apps
```bash
# Terminal 1
cd Server && npm run dev

# Terminal 2
cd Frontend && npm run dev

# Terminal 3
cd Admin && npm run dev
```

4. Open

- Frontend: `http://localhost:5173`
- Admin: `http://localhost:5174`
- API root: `http://localhost:8080/api`
- Health: `http://localhost:8080/health`

## Docs

- [Docs index](docs/README.md)
- [Setup guide](docs/SETUP.md)
- [API reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Environment variables](docs/ENVIRONMENT.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Known gaps](docs/KNOWN_GAPS.md)
- [Contributing](docs/CONTRIBUTING.md)

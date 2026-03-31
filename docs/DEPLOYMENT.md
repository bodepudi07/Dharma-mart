# Deployment Guide

This guide focuses on the current implementation.

## Overview

Deploy as three units:

- `Server` as a Node.js service
- `Frontend` as static build output
- `Admin` as static build output

## Production checklist

1. Configure production env vars (see [ENVIRONMENT.md](./ENVIRONMENT.md)).
2. Set `NODE_ENV=production` for server.
3. Set strict `CORS_ORIGINS` to production domains.
4. Build frontend and admin.
5. Start server with process manager.
6. Verify health and key API routes.
7. Validate payment callback/webhook behavior.

## Build commands

```bash
cd Frontend && npm run build
cd ../Admin && npm run build
```

## Server start

```bash
cd Server
npm start
```

## Recommended runtime setup

- Run server behind reverse proxy (Nginx/Caddy/Cloud load balancer).
- Enable HTTPS at proxy edge.
- Keep app process supervised (PM2/systemd/container orchestrator).
- Add basic monitoring on `/health`.

## Static hosting

Frontend and admin can be hosted on platforms that serve static assets.

- Frontend artifact: `Frontend/dist`
- Admin artifact: `Admin/dist`

Important:

- `VITE_API_URL` is build-time config. Rebuild when changing API URL.

## Post-deploy verification

Run smoke checks:

```bash
curl https://your-api-domain/health
curl https://your-api-domain/api
curl https://your-api-domain/api/products
```

UI checks:

- Frontend loads product list and can add to cart.
- Admin dashboard loads counts and lists.
- Category/product/vendor CRUD works.
- Order create/status flow works for COD.

Payment checks:

- Cashfree order creation works.
- Return URL reaches frontend order success page.
- Webhook signature verification succeeds.

## Current caveat to resolve before payment go-live

The default notify URL builder in `cashfreeService.js` uses `/api/payments/webhook`, while the actual route is `/api/orders/webhook`.

Align these before production rollout.

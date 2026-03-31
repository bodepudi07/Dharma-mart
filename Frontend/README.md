# Frontend (Storefront)

Customer-facing React app for Dharma Mart.

## Tech stack

- React 19
- React Router
- Vite
- Tailwind CSS

## Routes

- `/`
- `/products`
- `/products/:id`
- `/cart`
- `/checkout`
- `/order-success`

## Environment

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:8080/api
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Notes

- Guest cart is session-based (`sessionId` stored in localStorage).
- Checkout supports COD and Cashfree flow from the UI.
- API base URL is fully driven by `VITE_API_URL`.

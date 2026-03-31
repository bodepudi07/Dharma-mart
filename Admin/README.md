# Admin (Dashboard)

React admin dashboard for managing Dharma Mart entities.

## Tech stack

- React 19
- React Router
- Vite
- Tailwind CSS

## Main pages

- Dashboard summary
- Categories CRUD
- Products CRUD
- Vendors CRUD and approve/reject
- Orders list and status updates

## Environment

Create `Admin/.env`:

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

- This UI currently assumes open API access and does not implement admin auth.
- Product create/update sends multipart form data for image uploads.

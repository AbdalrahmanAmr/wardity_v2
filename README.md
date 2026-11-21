# Wardity

Wardity is a React/Vite storefront with an Express/MySQL backend for floral
and gift orders.

## Development

Install dependencies in the repository root and in `backend/`, then configure
the environment files:

```bash
npm install
cd backend
npm install
```

Copy `.env.example` to `.env` in both the root and `backend/` directories.
Set a real `JWT_SECRET` before starting the backend.

Run the frontend with `npm run dev` from the repository root. Run the backend
with `npm run dev` from `backend/`. MySQL must be available and the backend
database settings must point to a Wardity database.

## Production and setup documentation

- [Production server setup](docs/SERVER_SETUP.md)
- [Pre-launch report](docs/PRELAUNCH_REPORT.md)
- [Setup guides](docs/setup/README.md)
- [Security actions](docs/SECURITY_ACTIONS.md)

The backend uses MySQL only. Do not use the example credentials or JWT
placeholder in a production deployment.

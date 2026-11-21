# Wardity

Wardity is a React/Vite storefront with an Express/MySQL backend for floral
and gift orders.

## Production build

```bash
npm install
cd backend
npm install
npm run build
cd ..
npm run build
```

Copy `.env.example` to `.env` in both the repository root and `backend/`.
Replace every placeholder and secret, set the exact public frontend origin in
`CORS_ORIGIN`, and set `NODE_ENV=production`.

Deploy the contents of `dist/` from the repository root to the static web
host or reverse proxy. Start the API from `backend/` with:

```bash
npm start
```

The frontend API URL must be `/api`, and the web server must proxy `/api` and
`/uploads` to port `3001`.

## Operations

- [Pre-launch report](docs/PRELAUNCH_REPORT.md)
- [Server requirements](docs/SERVER_REQUIREMENTS.md)
- [Security actions](docs/SECURITY_ACTIONS.md)
- [Backend setup](docs/BACKEND_SETUP.md)
- [Tracking setup](docs/setup/tracking.md)

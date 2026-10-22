# Wardity backend setup

The backend is a Node.js, Express, TypeScript, and MySQL API. SQLite is not
supported by the current server. The backend initializes the required MySQL
tables at startup; it does not create a MySQL server or invent production
catalog data.

## Local development

From the repository root:

```bash
npm install
cd backend
npm install
cp .env.example .env
```

Set a unique local JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Configure `backend/.env` with a running MySQL instance:

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=<generated-secret>
JWT_EXPIRES_IN=7d
DB_DRIVER=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=wardity_app
MYSQL_PASSWORD=<database-password>
MYSQL_DATABASE=wardity
CORS_ORIGIN=http://localhost:5173
DEV_CORS_ORIGINS=http://localhost:5173
UPLOADS_DIR=./uploads
```

Install and start the backend:

```bash
npm run typecheck
npm run build
npm run dev
```

The API is available at `http://localhost:3001`. Check it from another
terminal:

```bash
curl http://localhost:3001/health
```

## Database and sample data

Use `npm run seed` only for a new development database or after reviewing the
seed script. It inserts sample users and catalog data and should not be run
blindly against production.

```bash
npm run seed
```

## Frontend connection

At the repository root, create `.env` from `.env.example`:

```env
VITE_API_URL=http://localhost:3001/api
```

Then run the frontend in a second terminal:

```bash
cd ..
npm run dev
```

## Production commands

```bash
npm ci
npm run typecheck
npm run build
npm start
```

For the complete SSH, MySQL, Nginx, systemd, and HTTPS procedure, see
[SERVER_SETUP.md](./SERVER_SETUP.md) and the hosting checklist in
[SERVER_REQUIREMENTS.md](./SERVER_REQUIREMENTS.md).

## Important production settings

- Set `NODE_ENV=production`.
- Use a dedicated MySQL user, not `root`.
- Set `CORS_ORIGIN` to the exact HTTPS frontend origin.
- Keep `JWT_SECRET` at least 32 random bytes.
- Put `UPLOADS_DIR` and contact settings on persistent writable storage.
- Keep notification and tracking tokens in the backend environment only.

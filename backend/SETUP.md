# Backend quick setup guide

The current backend requires MySQL. SQLite settings from older documentation
are no longer valid.

## 1. Install dependencies

```bash
cd backend
npm install
```

## 2. Configure the environment

Create `backend/.env`:

```env
PORT=3001
NODE_ENV=development
REQUEST_BODY_LIMIT=100kb
JWT_SECRET=<generated-secret>
JWT_EXPIRES_IN=7d
DB_DRIVER=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=wardity_app
MYSQL_PASSWORD=<database-password>
MYSQL_DATABASE=wardity
MYSQL_CONNECTION_LIMIT=10
MYSQL_QUEUE_LIMIT=0
MYSQL_TIMEZONE=Z
UPLOADS_DIR=./uploads
PRODUCTS_DEFAULT_PAGE_SIZE=20
CORS_ORIGIN=http://localhost:5173
DEV_CORS_ORIGINS=http://localhost:5173
```

Generate a signing secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

The backend refuses to start when `JWT_SECRET` is missing, too short, or a
known placeholder.

## 3. Initialize development data

The schema is initialized when the backend starts. To insert sample data:

```bash
npm run seed
```

This is for development only. Review the seed script before using it on an
existing or production database.

## 4. Start and test the server

```bash
npm run dev
curl http://localhost:3001/health
```

The API is available at `http://localhost:3001`.

## 5. Connect the frontend

From the repository root, set:

```env
VITE_API_URL=http://localhost:3001/api
```

Then start the Vite development server:

```bash
npm run dev
```

## Production

```bash
npm ci
npm run typecheck
npm run build
npm start
```

For the complete SSH deployment, MySQL account, Nginx, systemd, and HTTPS
instructions, see [SERVER_SETUP.md](../SERVER_SETUP.md). See
[SERVER_REQUIREMENTS.md](../SERVER_REQUIREMENTS.md) for minimum server
capacity and required persistent storage.

## Troubleshooting

- **Port already in use:** change `PORT` and update the reverse proxy.
- **Database connection errors:** check MySQL is running and all `MYSQL_*`
  values match the database account.
- **CORS errors:** set `CORS_ORIGIN` to the exact frontend origin.
- **Missing images:** ensure `UPLOADS_DIR` exists and is writable by the
  backend service account.

# Quick Setup Guide

## 1. Install Dependencies

```bash
cd backend
npm install
```

## 2. Configure Environment

Create a `.env` file in the `backend` directory:

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=
JWT_EXPIRES_IN=7d
DB_DRIVER=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-local-password
MYSQL_DATABASE=wardity_import_nofk_20261016
CORS_ORIGIN=http://localhost:5173
```

Generate a unique signing secret and set it as `JWT_SECRET` (at least 32 bytes):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 3. Seed the Database

This will create initial data including:
- A test user (test@example.com / password123)
- Sample products, categories, and occasions

```bash
npm run seed
```

## 4. Start the Server

```bash
npm run dev
```

The server will be available at `http://localhost:3001`

## 5. Update Frontend Configuration

In your frontend `.env` file (or `vite.config.ts`), set:

```env
VITE_API_URL=http://localhost:3001/api
```

## Testing the API

### Health Check
```bash
curl http://localhost:3001/health
```

### Register a User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Products (with token)
```bash
curl http://localhost:3001/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Port Already in Use
If port 3001 is already in use, change `PORT` in `.env`

### Database Errors
Delete `data/wardity.db` and run `npm run seed` again

### CORS Issues
Make sure `CORS_ORIGIN` in `.env` matches your frontend URL

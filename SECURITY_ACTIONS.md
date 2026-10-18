# Security and Environment Setup Actions

Use this checklist when configuring a local or production Wardity deployment.

## 1. Configure the backend

1. If `backend/.env` does not exist, create it from `backend/.env.example`.
2. Generate a unique JWT signing key:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. Put the generated value in `JWT_SECRET` in `backend/.env`. Use at least 32
   bytes of random data. The backend refuses to start if this key is missing,
   too short, or a known placeholder.
4. Set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and
   `MYSQL_DATABASE` to the database instance for this environment. Use a
   dedicated database account with only the permissions the application needs;
   avoid a shared or unrestricted production account.
5. Set `CORS_ORIGIN` to the exact browser origins allowed to call the API.
   `DEV_CORS_ORIGINS` is for local development only; do not use it as a
   production allowlist.
6. Set notification and tracking variables only when those integrations are
   enabled. Keep bot tokens, API tokens, and database passwords in the backend
   environment, never in frontend `VITE_*` variables.
7. Tune request size, pagination, database pool, and integration timeout values
   only when needed. Integer settings are validated at startup; `MYSQL_QUEUE_LIMIT`
   may be zero.

## 2. Configure the frontend

1. If the root `.env` does not exist, create it from the root `.env.example`.
2. Set `VITE_API_URL` to the public API base URL used by the browser.
3. Set `VITE_META_PIXEL_ID` and `VITE_GA4_ID` only if the corresponding tracking
   integrations are intentionally enabled.
4. Treat every `VITE_*` value as public: Vite embeds it in browser assets. Never
   put a password, private token, or signing key in a frontend environment file.

## 3. Keep environment files private

- `.env` files are ignored by Git; commit only the `.env.example` templates with
  blank secret fields.
- Configure production values in the hosting platform's secret/environment
  manager, not in source control or deployment logs.
- If a secret was committed, shared, or used in an unauthorized deployment,
  replace it at the issuing provider and update the environment. Rotating
  `JWT_SECRET` immediately invalidates existing login tokens; users will need to
  sign in again.
- Verify before publishing with `git status --short` and confirm no `.env` file
  is staged or tracked.

## 4. Verify a local setup

From PowerShell at the repository root:

```powershell
if (!(Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
if (!(Test-Path .env)) { Copy-Item .env.example .env }
Push-Location backend
npm run typecheck
npm run build
Pop-Location
```

Start the server separately with `Push-Location backend; npm run dev` and check
`http://localhost:3001/health`. If startup fails, first check that `JWT_SECRET`
is set and that the MySQL connection values point to a running database.

## Environment variable reference

### Backend (`backend/.env`)

| Variable | Purpose |
| --- | --- |
| `PORT`, `NODE_ENV`, `REQUEST_BODY_LIMIT` | HTTP listener, runtime mode, and request-size limit |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | JWT signing key and token lifetime |
| `DB_DRIVER`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` | Database driver and connection |
| `MYSQL_CONNECTION_LIMIT`, `MYSQL_QUEUE_LIMIT`, `MYSQL_TIMEZONE` | MySQL pool and date handling |
| `UPLOADS_DIR`, `PRODUCTS_DEFAULT_PAGE_SIZE` | Upload storage and default product pagination |
| `CORS_ORIGIN`, `DEV_CORS_ORIGINS` | Production and local-development browser origin allowlists |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Optional Telegram order notifications |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ORDER_RECIPIENTS`, `WHATSAPP_API_VERSION` | Optional WhatsApp order notifications |
| `ORDER_NOTIFICATION_TIMEOUT_MS` | Timeout for order-notification requests |
| `META_PIXEL_ID`, `META_CAPI_TOKEN`, `META_GRAPH_VERSION`, `META_TEST_EVENT_CODE`, `META_CAPI_TIMEOUT_MS` | Optional server-side Meta event tracking |

### Frontend (root `.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Browser-facing API base URL |
| `VITE_META_PIXEL_ID`, `VITE_GA4_ID` | Optional public analytics identifiers (not secrets) |

The application also has fixed product/domain behavior (for example, supported
currency and provider API hosts). These are not secret deployment settings and
are not exposed as environment variables.

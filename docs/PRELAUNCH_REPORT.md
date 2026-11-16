# Wardity Pre-launch Audit

Date: 2026-11-16

## Executive summary

**Go/no-go: NO-GO.** The requested Phase A hardening and concurrency tests now
pass, but the free-shipping threshold remains 2,000 EGP rather than the
requested 1,700 EGP, as explicitly left unchanged for this phase. Root lint
also fails on the new test harness and existing warnings until the lint
findings are addressed. One high production dependency advisory remains
because its only available fix is the major Zod 4 upgrade.

## Revised checklist status

| Requirement | Status | Evidence |
|---|---|---|
| Graph/WhatsApp default version v26.0 | Done | [orderNotifications.ts](../backend/src/services/orderNotifications.ts:176), [metaCapi.ts](../backend/src/services/metaCapi.ts:63), [.env.example](../backend/.env.example:43), [SERVER_SETUP.md](SERVER_SETUP.md:180), [tracking.md](setup/tracking.md:27) |
| JWT HS256 and required `exp` | Done | [jwt.ts](../backend/src/utils/jwt.ts:36-45) |
| App rate limiting | Done | [rateLimit.ts](../backend/src/middleware/rateLimit.ts:5-37), auth/order/newsletter/admin routes |
| Persisted CAPI status/error and non-blocking behavior | Done | [init-mysql.ts](../backend/src/database/init-mysql.ts:369), [metaCapi.ts](../backend/src/services/metaCapi.ts:25-88) |
| Conditional stock update and rollback on zero affected rows | Done | [orders-mysql.ts](../backend/src/routes/orders-mysql.ts:368-378) |
| Admin status allow-list and order ID validation | Done | [admin-mysql.ts](../backend/src/routes/admin-mysql.ts:218-263) |
| Isolated order-flow/tampering harness | Done | [order-flow-test.ts](../backend/src/scripts/order-flow-test.ts:1-310) |
| Free-shipping threshold 1,700 EGP | Not done by instruction | Current production rule remains 2,000 EGP at [orders-mysql.ts](../backend/src/routes/orders-mysql.ts:319-340) |

## Ranked findings

### Blocker

1. **Free-shipping threshold is still wrong.** The server and client use a
   2,000 EGP threshold, while the audit requirement is 1,700 EGP. This was
   intentionally not changed per the latest instruction.
2. **Production audit is not clean.** `zod@3.25.76` remains affected by
   GHSA-mrhx-c7xc-m3w5 (high, fix available only as `zod@4.6.7`, a major
   upgrade). Do not launch without accepting, testing, and scheduling that
   major migration.

### Should-fix

1. **Lint warnings remain.** `npm run lint` now passes with 43 warnings,
   including existing non-null assertions, hook dependency, and fast-refresh
   findings. The production build and backend typecheck/build pass.
2. **Backend schema migrations run at startup.** The idempotent CAPI migration
   is safe, but production should still use a deliberate backup-and-migration
   procedure ([init-mysql.ts](../backend/src/database/init-mysql.ts:363-377)).
3. **No backend-specific lint script exists.** Root ESLint is the available
   quality gate.
4. **Seed workflow remains incomplete.** `backend/package.json` references a
   missing `src/scripts/seed.ts`.
5. **Security headers remain incomplete.** Nginx runbook guidance exists, but
   application-level Helmet/CSP is not installed.

### Nice-to-have

1. Browserslist data is stale; the frontend build reports an 11-month-old
   `caniuse-lite`.
2. Reduce existing lint warnings, especially hook dependency and fast-refresh
   warnings.
3. Add automated browser/device coverage for Arabic/RTL checkout, admin
   orders, mobile layout, and Arabic WhatsApp rendering.

## Validation results

| Area | Command | Result |
|---|---|---|
| Frontend lint | `npm run lint` | Pass: 0 errors, 43 warnings |
| Frontend production build | `npm run build` | Pass; Browserslist warning only |
| Backend typecheck | `cd backend; npm run typecheck` | Pass |
| Backend build | `cd backend; npm run build` | Pass |
| Isolated order-flow | `cd backend; npm run test:order-flow` | Pass against `wardity_test` |
| Database guard | `TEST_DATABASE_NAME=wardity_dev` | Refused execution |
| Concurrent stock test | Included in order-flow harness | Pass: two orders for one item produced 201/409; stock 0; one order item |
| Production dependency audit | `npm audit --omit=dev` | One high Zod advisory remains |

The harness verifies register/login, cart, checkout, server-derived totals,
tampered prices and quantities, ownership checks, out-of-stock behavior,
WhatsApp's ordered 11 parameters and sanitization, image header, maximum
three follow-up images, Meta success/error/timeout/missing credentials,
persisted CAPI status, and login rate limiting.

## Dependency advisories

After non-breaking fixes and updating Express to the latest 4.x patch
(`4.22.3`), the remaining production audit is:

| Package | Severity | Dependency path | Fix version |
|---|---|---|---|
| zod | High | `wardity-backend > zod@3.25.76` | `4.6.7` (major; not applied) |

The earlier `body-parser` high, `multer` high, `proxy-addr` critical, and
`qs` moderate advisories were removed by non-breaking dependency updates.

## Production environment and live-only checklist

Required frontend variables are `VITE_API_URL`, `VITE_META_PIXEL_ID`,
`VITE_GA4_ID`, and `VITE_FACEBOOK_URL`. Required backend variables include
`NODE_ENV`, `JWT_SECRET`, `JWT_EXPIRES_IN`, MySQL connection settings,
`CORS_ORIGIN`, upload/contact paths, notification settings, and Meta settings
listed in [backend/.env.example](../backend/.env.example).

- [ ] Use the real HTTPS frontend origin and verify CORS rejects unrelated origins.
- [ ] Verify login, expiry, normal-user 403 responses on every admin endpoint,
  and production-only proxy trust.
- [ ] Complete orders below, exactly at, and above the intended 1,700 EGP
  threshold after that business-rule change is approved.
- [ ] Verify WhatsApp template payloads and Arabic encoding with provider
  credentials.
- [ ] Verify Meta/WhatsApp errors, timeouts, missing credentials, and persisted
  statuses in production-like conditions.
- [ ] Verify Pixel/GA4 consent gating, shared Purchase `event_id`, normalized
  hashes, and optional test event code.
- [ ] Test invalid image type/size/name and path traversal.
- [ ] Test Arabic/RTL checkout and admin orders on mobile devices.
- [ ] Take and restore a MySQL backup before migration; verify Nginx HTTPS,
  headers, rate limiting, PM2/systemd restart, logs, and rollback.

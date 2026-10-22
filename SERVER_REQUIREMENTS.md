# Minimum production server requirements

This document describes the minimum supported shape for hosting the current
Wardity website. It is intentionally separate from the deployment commands in
[SERVER_SETUP.md](./SERVER_SETUP.md).

## Recommended minimum

| Resource | Minimum | Recommended for a small store |
| --- | --- | --- |
| Operating system | Ubuntu 22.04/24.04 LTS, 64-bit | Ubuntu 24.04 LTS |
| CPU | 2 shared vCPUs | 2-4 vCPUs |
| RAM | 2 GB | 4 GB |
| Disk | 25 GB SSD | 50 GB+ SSD |
| Network | Public IPv4, DNS control, inbound 80/443 | IPv4 and IPv6 |
| Node.js | 20.x or newer LTS | Current Node.js LTS |
| npm | Bundled with Node.js | Latest bundled npm |
| Web server | Nginx or equivalent reverse proxy | Nginx |
| Database | MySQL 8.0+ | MySQL 8.0/8.4 |

The minimum assumes modest traffic and a separate or local MySQL instance. Add
CPU, RAM, database capacity, and object storage as traffic, catalog size, image
volume, or reporting load grows.

## Required capabilities

The host must support:

- Long-running Node.js processes managed by `systemd`, Supervisor, or an
  equivalent process manager.
- MySQL connections from the backend and a database account with access to the
  Wardity database.
- Persistent writable storage for `backend/uploads` and
  `backend/config/contact-settings.json`.
- TLS certificates and automatic renewal.
- DNS records for the production domain.
- Firewall rules allowing SSH (preferably from trusted IPs), HTTP, and HTTPS;
  port `3001` should remain private and must not be exposed publicly.
- At least 10 GB free space for operating-system updates, npm builds, logs,
  database growth, and image uploads.

## Application-specific requirements

The backend is MySQL-only. Set `DB_DRIVER=mysql` and provide all five required
database values: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`,
and `MYSQL_DATABASE`.

The frontend is a static Vite build. It needs no Node.js process in production
after `npm run build`; serve the generated `dist/` directory through Nginx or
another static host. Set `VITE_API_URL=/api` when frontend and API share the
same domain.

The backend listens on port `3001` by default and exposes:

- `/health` for the health check.
- `/api/*` for the application API.
- `/uploads/*` for product and admin-uploaded media.

The reverse proxy must forward all three paths to the backend and must provide
SPA fallback to `dist/index.html` for frontend routes.

## Optional integrations

Order notifications and server-side marketing tracking are disabled unless
their backend environment variables are configured. Provider credentials are
secrets and must only be stored in the backend secret environment. The
frontend `VITE_*` variables are public and must never contain credentials.

## Operational baseline

Before going live, configure:

1. Daily encrypted MySQL backups and a tested restore procedure.
2. Backups of the persistent uploads and contact-settings directories.
3. Log rotation and disk-space monitoring.
4. HTTPS renewal monitoring.
5. A deployment rollback path and a documented owner for secrets.
6. A dedicated non-root database user and application user.

For the complete SSH installation sequence, see
[SERVER_SETUP.md](./SERVER_SETUP.md).

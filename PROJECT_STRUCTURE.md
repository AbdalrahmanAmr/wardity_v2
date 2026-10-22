# Wardity project structure

Wardity is a full-stack e-commerce application. The frontend is a Vite
single-page application and the backend is an Express API backed by MySQL.

## Repository layout

```text
Wardity/
├── src/                         # React + TypeScript storefront
│   ├── assets/                  # Images, fonts, and icons bundled by Vite
│   ├── components/              # Shared, feature, layout, and admin UI
│   ├── config/                  # Frontend environment configuration
│   ├── constants/               # Routes, API paths, storage, pagination
│   ├── contexts/                # Auth, cart, wishlist, language, delivery
│   ├── hooks/                   # Reusable React hooks
│   ├── layouts/                 # Application layouts
│   ├── lib/                     # Tracking and third-party helpers
│   ├── locales/                 # English and Arabic translations
│   ├── pages/                   # Storefront and admin pages
│   ├── router/                  # React Router configuration/loaders
│   ├── services/                # API client and TanStack Query hooks
│   ├── types/                   # Domain and API TypeScript types
│   ├── utils/                   # Formatting and compatibility helpers
│   └── main.tsx                 # Frontend entry point
├── public/                      # Files copied directly to dist/
├── backend/
│   ├── src/
│   │   ├── config/              # Runtime configuration
│   │   ├── database/            # MySQL pool and schema initialization
│   │   ├── middleware/          # Auth and error middleware
│   │   ├── routes/              # Public, customer, and admin API routes
│   │   ├── scripts/             # Seed and migration commands
│   │   ├── services/            # Notifications and tracking services
│   │   └── utils/               # JWT, uploads, passwords, validation
│   ├── config/                  # Contact settings JSON (persistent in prod)
│   ├── uploads/                 # Local upload storage (ignored by Git)
│   ├── .env.example             # Backend configuration template
│   └── package.json
├── docs/setup/                  # Contact-channel setup and limitations
├── dist/                        # Generated frontend build (not committed)
├── .env.example                 # Public frontend configuration template
├── SERVER_SETUP.md              # SSH deployment runbook
├── SERVER_REQUIREMENTS.md       # Minimum hosting requirements
└── SECURITY_ACTIONS.md          # Secret and environment checklist
```

## Runtime boundaries

### Frontend

`npm run build` creates `dist/`, a static browser application. `VITE_API_URL`
defaults to `/api`, so a production reverse proxy can serve the frontend and
backend from one origin. All `VITE_*` values are public after the build.

### Backend

`backend/npm run build` compiles `backend/src` to `backend/dist`. The production
entrypoint is `node backend/dist/index.js`. The API requires MySQL and refuses
to start unless `DB_DRIVER=mysql` and the MySQL settings are present.

The backend exposes `/health`, `/api/*`, and `/uploads/*`. Uploaded media and
`backend/config/contact-settings.json` must be kept on persistent writable
storage when deploying or replacing releases.

## Source-of-truth configuration

- Frontend variables: [.env.example](./.env.example)
- Backend variables: [backend/.env.example](./backend/.env.example)
- Backend scripts: [backend/package.json](./backend/package.json)
- Local and production security checks: [SECURITY_ACTIONS.md](./SECURITY_ACTIONS.md)

Do not document or commit real passwords, JWT secrets, access tokens, or
provider credentials.

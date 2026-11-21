# Wardity launch test phases

Run Phase 1 against a production-like staging server before DNS and provider
credentials are enabled for public traffic. Run Phase 2 only after the release
is live.

## Phase 1 - Pre-launch

### Build and configuration

- [ ] Frontend `npm ci && npm run build`
- [ ] Backend `npm ci && npm run typecheck && npm run build`
- [ ] `NODE_ENV=production`
- [ ] `DB_DRIVER=mysql`
- [ ] Dedicated MySQL application account
- [ ] Unique 32-byte-or-larger `JWT_SECRET`
- [ ] Exact HTTPS `CORS_ORIGIN`
- [ ] `VITE_API_URL=/api`
- [ ] No secret is present in any `VITE_*` variable
- [ ] No `.env`, credential, or database dump is tracked
- [ ] `UPLOADS_DIR` and `CONTACT_SETTINGS_PATH` use persistent storage
- [ ] Admin path is non-default or access is otherwise secured

### HTTP and application errors

- [ ] `400` means invalid client input or malformed JSON
- [ ] `401` means authentication is missing
- [ ] `403` means authentication is valid but access is denied
- [ ] `404` means a resource or route was not found
- [ ] `409` means a valid request conflicts with state
- [ ] `429` means a configured rate limit was exceeded
- [ ] `500` hides internal details and returns `{ "message": "Internal server error", "status": 500 }`
- [ ] Zod validation returns `400` with field-level `errors`
- [ ] The server writes stack, request context, status, and environment to an
  error log only
- [ ] Error responses never expose SQL, secrets, database errors, or stack traces

### Customer flow

- [ ] Homepage, catalog, categories, occasions, search, brands, and product pages
- [ ] Arabic and English, including RTL layout
- [ ] Registration, login, logout, password and token expiry behavior
- [ ] Cart add, update, remove, duplicate, stock, and empty-cart cases
- [ ] Guest/customer checkout and server-calculated totals
- [ ] Price and quantity tampering are rejected
- [ ] COD and shipping-quote behavior
- [ ] Duplicate order submission and concurrent stock purchase
- [ ] Order tracking and order ownership
- [ ] Wishlist and profile

### Admin flow

- [ ] Normal customer cannot access admin endpoints
- [ ] Admin login and logout
- [ ] Product create/edit/delete and image upload
- [ ] Category and occasion create/edit/delete
- [ ] Carousel and delivery-location management
- [ ] Order status and shipping quote updates
- [ ] User management
- [ ] Contact settings
- [ ] Unauthorized upload, invalid type, oversized file, and deletion checks

### WhatsApp

- [ ] Meta Business account and WhatsApp Business Account are verified
- [ ] Phone-number ID and token are backend-only
- [ ] Template name and language exactly match the approved template
- [ ] Utility template was approved
- [ ] Test recipient is authorized
- [ ] Text parameters 1-11 render correctly in Arabic
- [ ] Header image is HTTPS and publicly accessible
- [ ] One or three follow-up images behave as expected
- [ ] Success, provider rejection, timeout, and missing credentials are handled
- [ ] `whatsapp_status` and `whatsapp_error` are persisted

### Meta Pixel and Conversions API

- [ ] Pixel ID is set in the frontend and backend
- [ ] Domain verification and consent copy are complete
- [ ] Pixel loads only after consent
- [ ] `ViewContent`, `AddToCart`, `InitiateCheckout`, and `Purchase` are emitted
- [ ] Browser and server Purchase events use the same `event_id`
- [ ] Pixel and CAPI emails/phones are normalized and hashed consistently
- [ ] Meta test-event code is temporary and removed before public launch
- [ ] Events Manager shows Browser and Server as deduplicated
- [ ] CAPI success, failure, timeout, and missing credentials are persisted

### Server security

- [ ] HTTPS and automatic renewal
- [ ] Firewall allows SSH and 80/443 only
- [ ] SSH key authentication and `fail2ban` or equivalent
- [ ] Root login disabled
- [ ] Database listens only locally or through a private network
- [ ] Backups are encrypted and off-server
- [ ] Upload and contact-settings storage is persistent
- [ ] Nginx SPA fallback and API proxy routes
- [ ] Security headers and CSP as allowed by the application
- [ ] Disk, certificate, health, restart, and backup monitoring

## Phase 2 - Post-launch

### Immediate checks

- [ ] DNS resolves to the server
- [ ] HTTPS certificate is valid
- [ ] `/health` returns `ok`
- [ ] Homepage and every critical route load
- [ ] Login and registration work
- [ ] Catalog and upload images load
- [ ] Test order reaches the admin panel
- [ ] WhatsApp and Meta test events complete
- [ ] Logs contain no secrets or repeated startup failures

### First-day monitoring

- [ ] Monitor CPU, memory, disk, MySQL, Nginx, and service restarts
- [ ] Confirm backup and upload backup complete
- [ ] Confirm no 404/500 trend in access/error logs
- [ ] Test one database restore
- [ ] Test one application rollback
- [ ] Remove temporary Meta test-event code
- [ ] Revoke temporary provider test credentials if required

### Go/no-go rules

Do not launch if any of these fail:

- MySQL or `/health` unavailable
- HTTPS/CORS misconfigured
- JWT secret is placeholder or exposed
- Unexpected 500s expose internals or break checkout
- Admin authorization is bypassable
- Database backup or restore is unverified
- Automated order notifications send incorrect customer or order data

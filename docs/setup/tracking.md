# Tracking setup

Wardity supports optional Meta Pixel, GA4, and server-side Meta Conversions
API tracking. Leave all IDs and tokens blank to disable the integrations.

## Frontend

Set these public build-time variables in the frontend `.env`:

```env
VITE_META_PIXEL_ID=<real-meta-pixel-id>
VITE_GA4_ID=<real-ga4-measurement-id>
VITE_API_URL=/api
```

The IDs are embedded in browser JavaScript and are not secrets. Tracking
scripts load only after visitor consent and only when a corresponding ID is
configured. Do not put a CAPI access token in any `VITE_*` variable.

## Backend

Set these server-only variables in `backend/.env`:

```env
META_PIXEL_ID=<same-meta-pixel-id>
META_CAPI_TOKEN=<server-only-access-token>
META_GRAPH_VERSION=v26.0
META_CAPI_TIMEOUT_MS=3000
META_TEST_EVENT_CODE=
```

The CAPI token must remain in the backend secret store. `META_TEST_EVENT_CODE`
is optional: set it temporarily for Meta Events Manager test traffic, then
clear it and restart the backend before live traffic.

## Deduplication and user data

Purchase events use the checkout `event_id` in both the browser Pixel and
server CAPI request. Email is trimmed and lowercased; phone is reduced to
digits; both are SHA-256 hashed before sending. Verify the event ID is identical
in browser and server requests using a disposable test order.

Do not enable tracking until the privacy/consent copy, real IDs, domain
verification, and Meta data-use settings have been reviewed. Test Purchase,
AddToCart, and InitiateCheckout in Events Manager without exposing access
tokens in browser network requests.

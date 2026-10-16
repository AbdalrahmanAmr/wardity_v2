# WhatsApp contact and Business API prerequisites

The storefront can publish a WhatsApp contact link from **Admin → Settings** (`/admin/settings`). Enter a phone number, use an international country code, then enable its switch. The resulting `https://wa.me/` destination contains digits only. A normal WhatsApp number enables a visitor to open a chat; it does **not** enable Wardity to send automated outbound messages.

## Automated messaging is not implemented

There is no WhatsApp Business Platform or Cloud API client in this project and no WhatsApp environment variables. Automated messaging requires a Meta Business account, a WhatsApp Business Account, an approved/registered phone number, a Cloud API phone-number ID, an access token stored as a production secret, and approved message templates for business-initiated conversations where required. Do not put tokens in Admin Settings, the JSON contact config, source control, or chat.

If a future integration is approved, the owner must choose the deployment's secret manager and define/document the actual variable names then. Test first with Meta's configured test number and an authorized recipient using the official Graph API test tooling; validate the response and delivery status before using an approved business number/template. Delivery can be limited by template approval, user opt-in and messaging windows, quality/rate limits, recipient country rules, account verification, and token permissions. This setup guide does not imply that any outbound messaging currently works.

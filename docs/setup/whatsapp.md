# WhatsApp contact and Business API prerequisites

The storefront can publish a WhatsApp contact link from **Admin → Settings** (`/admin/settings`). Enter a phone number, use an international country code, then enable its switch. The resulting `https://wa.me/` destination contains digits only. A normal WhatsApp number enables a visitor to open a chat; it does **not** enable Wardity to send automated outbound messages.

## Automated messaging is optional

Order notifications can use the WhatsApp Cloud API when the backend variables
`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ORDER_RECIPIENTS`, and
`WHATSAPP_API_VERSION` are configured. This is separate from the public
WhatsApp link. Automated messaging requires a Meta Business account, a
WhatsApp Business Account, an approved/registered phone number, a Cloud API
phone-number ID, an access token stored as a production secret, and approved
message templates where required. Do not put tokens in Admin Settings, the
JSON contact config, source control, or chat.

Test first with Meta's configured test number and an authorized recipient using
the official Graph API test tooling; validate the response and delivery status
before using an approved business number/template. Delivery can be limited by
template approval, user opt-in and messaging windows, quality/rate limits,
recipient country rules, account verification, and token permissions.

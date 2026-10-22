# Contact settings

For persistent production storage and deployment commands, see
[SERVER_SETUP.md](../../SERVER_SETUP.md).

## Where the settings live

In the running app, sign in with an administrator account and open **Admin → Settings** (`/admin/settings`). The form contains the four contact values and four independent **Show on storefront** switches. The fields and switches are stored separately.

The source defaults are in [`backend/config/contact-settings.json`](../../backend/config/contact-settings.json): phone `01115239553`, email `abdalrahmanamr275@gmail.com`, WhatsApp blank, and Telegram blank. All four switches start off. A public endpoint exposes only enabled, valid destinations; it never returns bot tokens or other credentials.

## Enable a method safely

1. Enter or verify the value for that method.
2. Turn on only that method's **Show on storefront** switch.
3. Save and inspect the footer on desktop and mobile.
4. Turn the switch off and save whenever the destination should no longer be public.

Phone and email values are preserved while disabled. WhatsApp accepts a phone number and its public `wa.me` URL uses digits only. Use an international country code for WhatsApp. Telegram accepts a public username or an HTTPS `t.me` link. Never enter a Telegram bot token in these fields.

For local development, edit the page or the JSON configuration file. The backend process must be able to write `backend/config/contact-settings.json` for Admin → Settings edits. In production, keep this path on persistent writable storage if admin changes must survive redeployments. Do not place secrets in this file.

Contact links only open the visitor's phone, email client, WhatsApp, or Telegram. Wardity currently has no outbound notification integration for those channels.

# Email contact and sending

The public contact email is editable on **Admin → Settings** (`/admin/settings`), with an independent visibility switch. The default value is `abdalrahmanamr275@gmail.com`, and it is not shown publicly until enabled. The link opens the visitor's email application with a `mailto:` link.

## Email sending status

This repository does not implement an email sender, SMTP client, or email provider. No SMTP, sender-address, or email-provider environment variable names are currently read by the application. Enabling the contact email only publishes the address; it does not send order notifications or contact-form messages.

Before adding outbound email, choose an SMTP service or a provider supported by the deployment, then document its actual required variables and configure them in `backend/.env` locally (ignored by Git) and in the production secret manager. Do not add real credentials to `.env.example`, source files, or documentation. The exact variable names and provider setup remain undecided because no email integration exists here.

After an integration is implemented, test delivery with a controlled recipient, then inspect the provider's delivery events and spam folder. Common issues include incorrect SMTP host/port or TLS mode, invalid credentials, unverified sender domains, SPF/DKIM/DMARC problems, quotas, and recipient-side spam filtering. None of those checks can be performed through the current app.

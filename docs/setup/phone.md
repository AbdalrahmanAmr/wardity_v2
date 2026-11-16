# Public phone contact

For production server and HTTPS setup, see
[SERVER_SETUP.md](../SERVER_SETUP.md).

The public phone value and its visibility switch are managed together on **Admin → Settings** (`/admin/settings`). The default value is blank and the phone link is disabled until a valid value is entered and its switch is enabled. The supplied display number is shown unchanged. The `tel:` target removes spaces and punctuation while retaining a leading `+`.

On a mobile device, open the storefront footer and tap the enabled phone number. Confirm that the operating system opens its dialer with the expected number; cancel before placing a call if you are only testing. Desktop behavior depends on whether a calling app is registered for `tel:` links.

For integrations that require international dialing, add the country code in the Admin Settings phone field. This changes the displayed value too. The storefront does not guess the country code or alter the supplied default. There is no phone/SMS notification integration or related environment variable in this project.

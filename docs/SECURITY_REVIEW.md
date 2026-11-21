# Git secret exposure review

## Confirmed finding

A JWT signing secret was committed to `backend/.env.example` and remained in
multiple reachable and unreachable Git commits:

- The deployment secret must be considered compromised.
- Rotate `JWT_SECRET` on every deployed environment.
- Restart the backend after installing the replacement secret.
- Existing JWT sessions will become invalid.
- Remove the value from Git history using an approved history rewrite.
- Audit forks, clones, release archives, and backups for copies.

The secret is no longer present in the current working tree. The current
example requires operators to provide a newly generated placeholder-free value.

## Other review results

- No actual `.env` file is tracked or present in the working tree.
- No private key, PEM, PFX, keystore, or deleted credential file was found.
- No confirmed WhatsApp, Meta CAPI, Telegram, cloud, AWS, GitHub, or Google
  credential was found.
- `MYSQL_PASSWORD=root` and provider values have been replaced with blanks or
  placeholders in the current configuration template.

## Required operator actions

1. Generate a replacement JWT secret with at least 32 random bytes.
2. Update the production secret manager and restart the backend.
3. Revoke or rotate any database/provider credential already used in deployment
   if it was copied from an example or shared outside the team.
4. Coordinate a Git history rewrite to remove the exposed JWT value.
5. Re-run secret scanning after the rewrite and on every pull request.

# Telegram contact and bot setup

The storefront can link to a public Telegram username or HTTPS `t.me`
destination set on **Admin → Settings** (`/admin/settings`). This public link
is separate from optional order notifications. Order notifications can use
`TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` when configured in the backend
environment. The public link does not require either variable.

## Create a bot (for a future integration)

1. In Telegram, open the verified **@BotFather** account, send `/newbot`, and follow its prompts for a display name and unique username.
2. BotFather issues a bot token. Treat it as a **secret credential**. Never paste it into source code, `contact-settings.json`, documentation, screenshots, or chat. Store it only in `backend/.env` locally (ignored by Git) and in the production secret manager.
3. To obtain a chat ID: open the bot and send it `/start` (a bot cannot
   initiate a private chat before the user starts it). Then call the Bot API
   `getUpdates` using the secret token and inspect the update's
   `message.chat.id`. For a group, add the bot and send a message there first.
   Keep this response private; group identifiers and update contents can be
   sensitive.
4. Configure only the public `@username` or `https://t.me/username` in Admin → Settings if visitors should contact the bot. Do not put the token there.

## Test, rotate, and troubleshoot

There is no in-app test-message feature yet. To manually test from a private PowerShell session, the following prompts for the secret instead of placing it in command history. First send `/start` to the bot, then use `getUpdates` to display only chat IDs:

```powershell
$secureToken = Read-Host "Bot token (secret)" -AsSecureString
$tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)
  $updates = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getUpdates"
  $updates.result | ForEach-Object { $_.message.chat.id } | Sort-Object -Unique
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
  Remove-Variable token, updates -ErrorAction SilentlyContinue
}
```

Then run a test with your private chat ID (the message is sent when you run this):

```powershell
$secureToken = Read-Host "Bot token (secret)" -AsSecureString
$chatId = Read-Host "Private test chat ID"
$tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)
  $body = @{ chat_id = $chatId; text = "Wardity private bot setup test" } | ConvertTo-Json
  $result = Invoke-RestMethod -Method Post -Uri "https://api.telegram.org/bot$token/sendMessage" -ContentType "application/json" -Body $body
  $result.ok
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
  Remove-Variable token, result, body -ErrorAction SilentlyContinue
}
```

Do not enable PowerShell transcription for this test, save a command containing a literal token, or paste a token-bearing request URL or error output into a ticket/chat. A future app integration must use backend-only environment/secret-manager configuration instead.

If a token leaks, use BotFather's `/revoke` flow, replace the stored secret in local/production secret storage, restart the backend, and inspect access logs. Troubleshoot by checking that the user started the bot, the bot was added to the correct group, the chat ID is for the intended destination, the token is current, and the bot has permission to post. Public contact links and backend order notifications are separate features.

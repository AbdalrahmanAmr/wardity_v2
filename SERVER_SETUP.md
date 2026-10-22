# Wardity production server setup

This runbook deploys Wardity to an Ubuntu server with:

- Nginx serving the Vite frontend and reverse-proxying `/api`, `/health`, and
  `/uploads` to the backend.
- Node.js running the compiled Express API under `systemd`.
- MySQL storing application data.
- A domain with HTTPS provided by Let's Encrypt.

The commands below are run from an SSH session as a user with `sudo` access.
Replace every value in angle brackets before running a command.

## 1. Connect to the server

From your local terminal:

```bash
ssh <server-user>@<server-ip>
```

The server should be a supported Ubuntu LTS installation. Keep the application
user separate from `root`:

```bash
sudo adduser --disabled-password --gecos "" wardity
sudo usermod -aG www-data wardity
sudo mkdir -p /var/www/wardity
sudo chown -R wardity:wardity /var/www/wardity
```

## 2. Install system packages

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git nginx mysql-server build-essential
```

Install the Node.js LTS release (the current project requires Node.js 20 or
newer):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

Enable MySQL and Nginx:

```bash
sudo systemctl enable --now mysql
sudo systemctl enable --now nginx
```

## 3. Create the production database

Create a database and a dedicated least-privilege application account. Do not
use the MySQL `root` account in `backend/.env`.

```bash
sudo mysql
```

Run the following SQL at the `mysql>` prompt:

```sql
CREATE DATABASE wardity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wardity_app'@'127.0.0.1' IDENTIFIED BY '<strong-database-password>';
GRANT ALL PRIVILEGES ON wardity.* TO 'wardity_app'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

If a production SQL dump exists, import it after creating the database:

```bash
mysql -u wardity_app -p wardity < /path/to/wardity-production.sql
```

On a new installation, the backend initializes its required tables on startup.
Run the seed script only when you intentionally want the repository's sample
data; never run it against a live store without reviewing the script first.

## 4. Upload the application

Clone the repository as the deployment user:

```bash
sudo -iu wardity
cd /var/www/wardity
git clone <repository-url> current
cd current
npm ci
cd backend
npm ci
cd ..
```

For later releases, upload or clone into a new release directory and switch
the `current` symlink only after validation. Do not copy `node_modules`,
`.env` files, `backend/uploads`, or build output from a developer machine.

## 5. Configure production environment files

Create the frontend environment file. `VITE_*` values are public and are
embedded in browser JavaScript; never put secrets here:

```bash
cd /var/www/wardity/current
cat > .env <<'EOF'
VITE_API_URL=/api
VITE_META_PIXEL_ID=
VITE_GA4_ID=
VITE_FACEBOOK_URL=
EOF
```

Generate a JWT secret without putting it in shell history:

```bash
JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
```

Create the backend environment file. The `CORS_ORIGIN` value must be the exact
public frontend origin:

```bash
cat > backend/.env <<EOF
PORT=3001
NODE_ENV=production
REQUEST_BODY_LIMIT=100kb
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
DB_DRIVER=mysql
UPLOADS_DIR=/var/lib/wardity/uploads
PRODUCTS_DEFAULT_PAGE_SIZE=20
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=wardity_app
MYSQL_PASSWORD=<strong-database-password>
MYSQL_DATABASE=wardity
MYSQL_CONNECTION_LIMIT=10
MYSQL_QUEUE_LIMIT=0
MYSQL_TIMEZONE=Z
CORS_ORIGIN=https://<domain>
DEV_CORS_ORIGINS=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ORDER_RECIPIENTS=
WHATSAPP_API_VERSION=v21.0
ORDER_NOTIFICATION_TIMEOUT_MS=5000
META_PIXEL_ID=
META_CAPI_TOKEN=
META_GRAPH_VERSION=v21.0
META_TEST_EVENT_CODE=
META_CAPI_TIMEOUT_MS=3000
EOF
unset JWT_SECRET
```

Create persistent directories and copy contact settings if the deployment has
an existing configuration:

```bash
sudo mkdir -p /var/lib/wardity/uploads /var/lib/wardity/config
sudo chown -R wardity:wardity /var/lib/wardity
cp backend/config/contact-settings.json /var/lib/wardity/config/contact-settings.json
rm backend/config/contact-settings.json
ln -s /var/lib/wardity/config/contact-settings.json backend/config/contact-settings.json
```

If the repository already contains production contact settings, preserve that
file instead of overwriting it with the default.

## 6. Build and validate

```bash
cd /var/www/wardity/current
npm run lint
npm run build
cd backend
npm run typecheck
npm run build
```

Check the backend manually before registering the service:

```bash
cd /var/www/wardity/current/backend
npm start
```

In a second SSH session:

```bash
curl --fail http://127.0.0.1:3001/health
```

Stop the foreground process with `Ctrl+C` after the health check succeeds.

## 7. Run the backend with systemd

Exit the `wardity` shell if necessary, then create the service:

```bash
sudo tee /etc/systemd/system/wardity-backend.service > /dev/null <<'EOF'
[Unit]
Description=Wardity backend API
After=network.target mysql.service
Requires=mysql.service

[Service]
Type=simple
User=wardity
Group=wardity
WorkingDirectory=/var/www/wardity/current/backend
ExecStart=/usr/bin/node /var/www/wardity/current/backend/dist/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now wardity-backend
sudo systemctl status wardity-backend --no-pager
curl --fail http://127.0.0.1:3001/health
```

View logs:

```bash
sudo journalctl -u wardity-backend -f
```

## 8. Configure Nginx

Replace `<domain>` with the real domain:

```bash
sudo tee /etc/nginx/sites-available/wardity > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name <domain> www.<domain>;

    root /var/www/wardity/current/dist;
    index index.html;
    client_max_body_size 10m;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/wardity /etc/nginx/sites-enabled/wardity
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Enable HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d <domain> -d www.<domain>
sudo certbot renew --dry-run
```

After HTTPS is active, update `CORS_ORIGIN` to `https://<domain>` if it was
temporarily configured otherwise, then restart the backend:

```bash
sudo systemctl restart wardity-backend
```

## 10. Smoke-test the deployment

```bash
curl --fail https://<domain>/health
curl --fail https://<domain>/api/products
```

Open `https://<domain>` in a browser and verify login, product images,
administrator uploads, cart, checkout, and order creation. Confirm that an
uploaded image remains available after restarting `wardity-backend`.

## Updating the application

```bash
sudo -iu wardity
cd /var/www/wardity/current
git pull --ff-only
npm ci
npm run build
cd backend
npm ci
npm run build
exit
sudo systemctl restart wardity-backend
sudo nginx -t
sudo systemctl reload nginx
curl --fail https://<domain>/health
```

Back up the MySQL database and `/var/lib/wardity` before every release. Keep
`.env` files, JWT secrets, database passwords, and provider tokens out of Git,
logs, tickets, and screenshots.

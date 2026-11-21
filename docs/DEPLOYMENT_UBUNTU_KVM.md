# Ubuntu KVM production deployment runbook

This runbook assumes Ubuntu 22.04 or 24.04 LTS, a public DNS domain, KVM or
another virtual-machine host, and SSH access. Replace every `<placeholder>`
before running the commands.

## 1. Initial server setup

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y nginx mysql-server curl git ufw certbot python3-certbot-nginx

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Do not expose TCP port `3001` publicly.

## 2. Install Node.js

Use Node.js 20 LTS or a later supported LTS release:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

Create a dedicated application account:

```bash
sudo useradd --system --create-home --shell /usr/bin/bash wardity
sudo mkdir -p /opt/wardity/releases /var/lib/wardity/{uploads,config} /var/log/wardity
sudo chown -R wardity:wardity /opt/wardity /var/lib/wardity /var/log/wardity
```

## 3. Configure MySQL

```bash
sudo mysql
```

Run inside MySQL:

```sql
CREATE DATABASE wardity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wardity_app'@'127.0.0.1' IDENTIFIED BY '<strong-database-password>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON wardity.* TO 'wardity_app'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

The backend creates missing application tables and columns. Restore a reviewed
database backup or import an approved catalog before enabling public traffic.
Never run legacy/test migration scripts against production without a backup.

## 4. Prepare the application

```bash
sudo -u wardity git clone <repository-url> /opt/wardity/releases/current
cd /opt/wardity/releases/current
npm ci
npm run build

cd backend
npm ci
npm run typecheck
npm run build
```

Set root and backend environment values in protected files owned by `wardity`.
The frontend build must use `VITE_API_URL=/api`; all `VITE_*` values are public.
Do not put tokens or database passwords in frontend variables.

Generate the JWT key on the server:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Create `/opt/wardity/releases/current/backend/.env` with production values.
Set `NODE_ENV=production`, `TRUST_PROXY=true`, `CORS_ORIGIN=https://<domain>`,
`MYSQL_HOST=127.0.0.1`, `MYSQL_USER=wardity_app`, the database password,
`UPLOADS_DIR=/var/lib/wardity/uploads`, and
`CONTACT_SETTINGS_PATH=/var/lib/wardity/config/contact-settings.json`.

Copy the contact settings file:

```bash
cp /opt/wardity/releases/current/backend/config/contact-settings.json \
  /var/lib/wardity/config/contact-settings.json
chmod 600 /opt/wardity/releases/current/backend/.env
chmod 600 /var/lib/wardity/config/contact-settings.json
```

## 5. Create the systemd service

Create `/etc/systemd/system/wardity.service`:

```ini
[Unit]
Description=Wardity API
After=network.target mysql.service

[Service]
Type=simple
User=wardity
WorkingDirectory=/opt/wardity/releases/current/backend
EnvironmentFile=/opt/wardity/releases/current/backend/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=3
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wardity
sudo systemctl status wardity
curl http://127.0.0.1:3001/health
sudo journalctl -u wardity -n 100 --no-pager
```

## 6. Configure Nginx

Create `/etc/nginx/sites-available/<domain>`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name <domain>;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name <domain>;

    root /opt/wardity/releases/current/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site and obtain TLS:

```bash
sudo ln -s /etc/nginx/sites-available/<domain> /etc/nginx/sites-enabled/<domain>
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d <domain>
sudo certbot renew --dry-run
```

## 7. Backups and logs

```bash
sudo mysqldump -u wardity_app -p --single-transaction wardity \
  | gzip > /var/backups/wardity-mysql-$(date +%F).sql.gz

tar -czf /var/backups/wardity-data-$(date +%F).tar.gz \
  /var/lib/wardity/uploads /var/lib/wardity/config
```

Use encrypted off-server storage for production backups and test restoration
before launch. Application error logs are written under `backend/logs/`.

## 8. Deployment and rollback

Build and validate a new release, then switch traffic only after verification:

```bash
sudo ln -sfn /opt/wardity/releases/<release> /opt/wardity/releases/current
sudo systemctl restart wardity
curl https://<domain>/health
curl -I https://<domain>/
```

Keep the previous release directory for rollback. Rollback should restore the
previous frontend/backend directories and, if migrations changed the database,
the corresponding verified database backup.

# FMov — Streaming Web Application

A modern, high-performance, cinematic movie and TV streaming web application built with React 19, TypeScript, Vite, Tailwind CSS, Express, and HLS.js. Designed and optimized for cross-device playback across desktops, laptops, mobile phones, tablets, Android TV, Google TV, and Fire TV Stick.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack & Architecture](#tech-stack--architecture)
3. [VPS Prerequisites](#vps-prerequisites)
4. [Step-by-Step VPS Installation](#step-by-step-vps-installation)
   - [Step 1: Update VPS & Install Base Packages](#step-1-update-vps--install-base-packages)
   - [Step 2: Install Node.js & npm (v20+ or v22 LTS)](#step-2-install-nodejs--npm-v20-or-v22-lts)
   - [Step 3: Install PM2 & Git](#step-3-install-pm2--git)
   - [Step 4: Clone or Upload the Project Code](#step-4-clone-or-upload-the-project-code)
   - [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
   - [Step 6: Install Node Dependencies](#step-6-install-node-dependencies)
   - [Step 7: Build for Production](#step-7-build-for-production)
   - [Step 8: Configure PM2 for Zero-Downtime Daemon](#step-8-configure-pm2-for-zero-downtime-daemon)
   - [Step 9: Configure Nginx as Reverse Proxy](#step-9-configure-nginx-as-reverse-proxy)
   - [Step 10: Set Up SSL / HTTPS (Let's Encrypt Certbot)](#step-10-set-up-ssl--https-lets-encrypt-certbot)
   - [Step 11: Configure Firewall (UFW)](#step-11-configure-firewall-ufw)
5. [Alternative: Docker & Docker Compose Deployment](#alternative-docker--docker-compose-deployment)
6. [Maintenance, Updating & Logs](#maintenance-updating--logs)
7. [Troubleshooting & Common Issues](#troubleshooting--common-issues)
8. [License](#license)

---

## Features

- **Cinematic Watch Experience**: 16:9 responsive video player with backdrop poster hero before playback, dynamic loading states, playback position preservation, and cinema mode.
- **Multiple Playback Providers**: Direct HLS stream player (`hls.js`) + integrated fallback providers (`vidsrc`, `vidlink`, `embedsu`, `autoembed`, `superembed`, `smashystream`, `fmov-mirror`, and aggregated sources).
- **Cross-Device & TV Remote Friendly**: Full D-Pad navigation for Smart TVs, Android TV, Google TV, and Amazon Fire TV Stick (`Space`/`Enter` to Play/Pause, `←`/`→` seek, `↑`/`↓` volume, `M` mute, `F` fullscreen, `C` subtitles).
- **Responsive Source Selector**: Compact, space-efficient horizontal chip selector for switching servers with zero clutter.
- **SEO & Social Sharing**: Dynamic metadata, OpenGraph tags, JSON-LD rich structured data, and server-rendered dynamic XML sitemaps at `/sitemap.xml`.
- **Search, Genres, Filters & Curated Catalog**: Fast client-side discovery + TMDB API proxy with caching.

---

## Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, HLS.js, React Router 7.
- **Backend / API**: Express 4 server (`server.ts`) running on Node.js with `tsx`. Proxies TMDB metadata, handles view counters, serves SEO sitemaps, and serves static built assets in production (`dist/`).
- **Production Server Model**:
  - Express runs on port `3000` (or custom `$PORT`).
  - Nginx terminates SSL (port 443) and forwards traffic to `127.0.0.1:3000`.
  - PM2 process manager keeps the Node service running 24/7 with auto-restart on crashes and server reboots.

---

## VPS Prerequisites

Before starting, ensure you have:

- A Linux VPS running **Ubuntu 22.04 LTS / 24.04 LTS** or **Debian 12** (minimum 1 vCPU, 1 GB RAM, 10 GB SSD recommended; 2 GB RAM recommended for smooth builds).
- Root access or a user account with `sudo` privileges.
- A registered domain name (e.g., `fmov.yourdomain.com`) with an **A record** pointing to your VPS IP address.

---

## Step-by-Step VPS Installation

### Step 1: Update VPS & Install Base Packages

Connect to your VPS via SSH:

```bash
ssh root@YOUR_SERVER_IP
```

Update your package lists and install basic utilities:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw software-properties-common
```

---

### Step 2: Install Node.js & npm (v20+ or v22 LTS)

Use the official NodeSource repository to install Node.js 22 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify that Node and npm are installed:

```bash
node -v   # Should output v22.x.x
npm -v    # Should output 10.x.x or higher
```

---

### Step 3: Install PM2 & Git

PM2 is a production process manager that keeps your application alive forever and reloads it upon system restarts:

```bash
sudo npm install -g pm2 tsx
```

---

### Step 4: Clone or Upload the Project Code

Create the web directory and clone or transfer your repository:

```bash
sudo mkdir -p /var/www/fmov
sudo chown -R $USER:$USER /var/www/fmov
cd /var/www/fmov

# If using Git:
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Alternatively, if uploading from your computer via rsync:
# rsync -avz --exclude 'node_modules' --exclude 'dist' ./ user@YOUR_SERVER_IP:/var/www/fmov/
```

Ensure file permissions are correct:

```bash
cd /var/www/fmov
chmod -R 755 .
```

---

### Step 5: Configure Environment Variables

Create the production `.env` file from the example:

```bash
cp .env.example .env
nano .env
```

Set the appropriate values for your environment:

```env
# Application Port (default: 3000)
PORT=3000
NODE_ENV=production

# Public application URL (used for sitemaps and metadata)
APP_URL=https://fmov.yourdomain.com

# TMDB API Credentials (Required for live movie and TV metadata)
# You can get a free key at: https://www.themoviedb.org/settings/api
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token_here

# Streaming & API endpoints
VITE_STREAM_API_BASE_URL=https://api.fmov.my
```

Save and exit `nano` (`Ctrl + O`, `Enter`, then `Ctrl + X`).

---

### Step 6: Install Node Dependencies

Install all project dependencies:

```bash
npm install
```

> **Note**: The package configuration includes an automatic `postinstall` hook (`node scripts/patch-vyla.js || true`) which automatically patches SDK dependencies to avoid memory leaks and unhandled timer exceptions.

---

### Step 7: Build for Production

Compile the client-side React code and Tailwind styles into the static `dist/` directory:

```bash
npm run build
```

Verify that the `dist/` directory was generated:

```bash
ls -la dist/
```

You should see `index.html`, `assets/`, etc.

---

### Step 8: Configure PM2 for Zero-Downtime Daemon

Create a PM2 ecosystem file `ecosystem.config.cjs` in `/var/www/fmov`:

```bash
cat << 'EOF' > ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "fmov-web",
      script: "server.ts",
      interpreter: "node",
      interpreter_args: "--import tsx",
      cwd: "/var/www/fmov",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
EOF
```

Start the application with PM2:

```bash
pm2 start ecosystem.config.cjs
```

Check the process status:

```bash
pm2 status
pm2 logs fmov-web --lines 20
```

Configure PM2 to automatically start on server reboot:

```bash
pm2 save
pm2 startup
```

*(Copy and execute the `sudo env PATH=...` command printed on the screen by `pm2 startup` if instructed).*

Test local connectivity:

```bash
curl -I http://127.0.0.1:3000
```
It should return an `HTTP/1.1 200 OK` response.

---

### Step 9: Configure Nginx as Reverse Proxy

Install Nginx:

```bash
sudo apt install -y nginx
```

Create a new Nginx configuration file for your domain:

```bash
sudo nano /etc/nginx/sites-available/fmov.conf
```

Paste the following configuration (replace `fmov.yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name fmov.yourdomain.com;

    # Gzip Compression for fast delivery
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml image/svg+xml;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Static assets caching
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|otf|ttf|svg|webp|avif)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    # Proxy all traffic to the Node.js Express server
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for video streams and API responses
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable the site configuration and verify syntax:

```bash
sudo ln -sf /etc/nginx/sites-available/fmov.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 10: Set Up SSL / HTTPS (Let's Encrypt Certbot)

Install Certbot for Nginx:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain and install a free SSL certificate:

```bash
sudo certbot --nginx -d fmov.yourdomain.com
```

Follow the prompts (enter your email address and accept the terms of service). Certbot will automatically configure HTTPS redirection in Nginx and configure renewal timers.

Test automated certificate renewal:

```bash
sudo certbot renew --dry-run
```

---

### Step 11: Configure Firewall (UFW)

Protect your VPS by enabling UFW and only allowing SSH, HTTP, and HTTPS:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Check firewall status:

```bash
sudo ufw status
```

Your streaming site is now live and secure at `https://fmov.yourdomain.com`!

---

## Alternative: Docker & Docker Compose Deployment

If you prefer deploying with Docker, you can use the following configuration:

### 1. `Dockerfile`

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm install --omit=dev && npm install -g tsx
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/data ./data
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000
CMD ["tsx", "server.ts"]
```

### 2. `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - TMDB_API_KEY=${TMDB_API_KEY}
      - APP_URL=${APP_URL}
    volumes:
      - ./data:/app/data
```

Start the container:

```bash
docker compose up -d --build
```

---

## Maintenance, Updating & Logs

### How to Update the Application

Whenever you push new updates or redesign changes:

```bash
cd /var/www/fmov
git pull origin main
npm install
npm run build
pm2 restart fmov-web
```

### Viewing Real-Time Logs

```bash
# View application output and error logs
pm2 logs fmov-web

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Managing PM2 Services

```bash
pm2 restart fmov-web   # Restart server
pm2 stop fmov-web      # Stop server
pm2 status             # Check CPU & RAM usage
```

---

## Troubleshooting & Common Issues

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **502 Bad Gateway** | Node.js process is stopped or failed to launch on port 3000 | Check `pm2 status` and `pm2 logs fmov-web`. Ensure `tsx` is installed and run `pm2 restart fmov-web`. |
| **Blank White Screen** | React assets were not built | Run `npm run build` inside `/var/www/fmov` and check that the `dist/` directory exists. |
| **Metadata / Posters Missing** | TMDB API rate limit or missing API key | Verify your `TMDB_API_KEY` in `/var/www/fmov/.env` and restart PM2. |
| **Port 3000 Already in Use** | Another instance is already bound to port 3000 | Run `sudo lsof -i :3000` to find the process ID, kill it with `sudo kill -9 <PID>`, and restart PM2. |
| **Nginx Test Fails (`nginx -t`)** | Syntax error in `/etc/nginx/sites-available/fmov.conf` | Check the file for missing semicolons `;` or mismatched braces `{}`. |
| **Out of Memory during `npm run build`** | VPS RAM is less than 1.5 GB | Create a 2GB swap file: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`. |

---

## License

This project is released for personal and educational streaming website deployment. All media metadata is provided via TMDB. Video stream sources are resolved via external providers.

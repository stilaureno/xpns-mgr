# Deployment Guide

This guide covers deploying the Expense Manager application to various platforms.

## Prerequisites

- Bun installed on your deployment server
- Git repository with your code
- Domain name (optional)

## Environment Setup

### 1. Environment Variables

Create a `.env` file in production:

```env
PORT=3000
DATABASE_PATH=/var/data/expenses.db
NODE_ENV=production
```

### 2. Database Setup

```bash
# Create data directory
mkdir -p /var/data

# Run migrations
bun run db:migrate

# Seed initial data
bun run db:seed
```

## Deployment Options

### Option 1: Direct Server Deployment

#### On Ubuntu/Debian

1. **Install Bun:**
```bash
curl -fsSL https://bun.sh/install | bash
```

2. **Clone your repository:**
```bash
git clone <your-repo-url>
cd expense-manager
```

3. **Install dependencies:**
```bash
bun install
```

4. **Setup database:**
```bash
bun run db:migrate
bun run db:seed
```

5. **Create systemd service:**
```bash
sudo nano /etc/systemd/system/expense-manager.service
```

Add:
```ini
[Unit]
Description=Expense Manager API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/expense-manager
Environment="PORT=3000"
Environment="DATABASE_PATH=/var/data/expenses.db"
Environment="NODE_ENV=production"
ExecStart=/root/.bun/bin/bun run src/index.ts
Restart=always

[Install]
WantedBy=multi-user.target
```

6. **Start service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable expense-manager
sudo systemctl start expense-manager
sudo systemctl status expense-manager
```

7. **Setup Nginx reverse proxy:**
```bash
sudo nano /etc/nginx/sites-available/expense-manager
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/expense-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

8. **Setup SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Create data directory
RUN mkdir -p /data

# Setup database
RUN bun run db:migrate

EXPOSE 3000

CMD ["bun", "run", "start"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - DATABASE_PATH=/data/expenses.db
      - NODE_ENV=production
    volumes:
      - expense-data:/data
    restart: unless-stopped

volumes:
  expense-data:
```

#### 3. Deploy

```bash
docker-compose up -d
```

#### 4. View logs

```bash
docker-compose logs -f
```

### Option 3: Cloud Platforms

#### Railway

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Deploy:
```bash
railway up
```

4. Set environment variables:
```bash
railway variables set PORT=3000
railway variables set NODE_ENV=production
```

#### Render

1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: expense-manager
    env: docker
    plan: free
    envVars:
      - key: PORT
        value: 3000
      - key: NODE_ENV
        value: production
```

2. Connect your GitHub repository to Render
3. Deploy automatically on push

#### Fly.io

1. Install flyctl:
```bash
curl -L https://fly.io/install.sh | sh
```

2. Create fly.toml:
```toml
app = "expense-manager"
primary_region = "lax"

[build]
  [build.args]
    BUN_VERSION = "1.0.0"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[mounts]
  source = "expense_data"
  destination = "/data"
```

3. Deploy:
```bash
fly launch
fly deploy
```

### Option 4: Kubernetes

#### 1. Create deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: expense-manager
spec:
  replicas: 3
  selector:
    matchLabels:
      app: expense-manager
  template:
    metadata:
      labels:
        app: expense-manager
    spec:
      containers:
      - name: expense-manager
        image: your-registry/expense-manager:latest
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          value: "3000"
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_PATH
          value: "/data/expenses.db"
        volumeMounts:
        - name: data
          mountPath: /data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: expense-data-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: expense-manager
spec:
  selector:
    app: expense-manager
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: expense-data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

#### 2. Deploy

```bash
kubectl apply -f deployment.yaml
```

## Database Backup

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/expense-manager"
DB_PATH="/var/data/expenses.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Copy database
cp $DB_PATH $BACKUP_DIR/expenses_$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "expenses_*.db" -mtime +30 -delete

echo "Backup completed: expenses_$DATE.db"
```

Add to crontab:
```bash
crontab -e
```

Add line:
```
0 2 * * * /path/to/backup.sh
```

## Monitoring

### 1. Health Check Endpoint

Already included: `GET /health`

### 2. PM2 Process Manager

```bash
npm install -g pm2

# Start with PM2
pm2 start --name expense-manager bun -- run start

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
```

### 3. Log Management

```bash
# View logs
pm2 logs expense-manager

# Rotate logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set secure environment variables
- [ ] Enable firewall (allow only 80, 443)
- [ ] Regular security updates
- [ ] Database backups
- [ ] Rate limiting (consider adding)
- [ ] Input validation
- [ ] SQL injection prevention (parameterized queries)
- [ ] CORS configuration
- [ ] Authentication (add JWT/OAuth)
- [ ] Error logging (without exposing sensitive data)

## Performance Optimization

### 1. Enable Compression

Add to index.ts:
```typescript
import { compress } from "hono/compress";
app.use("*", compress());
```

### 2. Add Caching

```typescript
import { cache } from "hono/cache";

app.use("/api/categories", cache({
  cacheName: "categories",
  cacheControl: "max-age=3600",
}));
```

### 3. Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_expenses_state ON expenses(state);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);
CREATE INDEX idx_expenses_date ON expenses(date);
```

## Troubleshooting

### Application won't start

```bash
# Check logs
journalctl -u expense-manager -n 50

# Check Bun installation
bun --version

# Check port availability
netstat -tlnp | grep 3000
```

### Database errors

```bash
# Check database file permissions
ls -la /var/data/expenses.db

# Re-run migrations
bun run db:migrate
```

### Memory issues

```bash
# Check memory usage
free -m

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## Updates and Maintenance

### Updating the Application

```bash
# Pull latest code
git pull origin main

# Install dependencies
bun install

# Run migrations
bun run db:migrate

# Restart service
sudo systemctl restart expense-manager
```

### Zero-Downtime Deployment

Use PM2 with cluster mode:

```bash
pm2 start ecosystem.config.js
pm2 reload expense-manager
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: "expense-manager",
    script: "bun",
    args: "run start",
    instances: 4,
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
};
```

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.

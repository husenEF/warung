# Warung Telegram Bot - Direct Deployment Guide

## Overview
This guide helps you deploy the Warung Telegram Bot directly on a VPS or cloud server without Docker.

## Prerequisites
- Node.js 18+ installed on your server
- PostgreSQL database
- Telegram Bot Token (get from @BotFather)
- Cloudflare R2 bucket (for image storage)
- PM2 or similar process manager (recommended for production)

## Step 1: Server Setup

### Install Node.js
```bash
# For Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# For CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install PM2 (Process Manager)
```bash
npm install -g pm2
```

## Step 2: Environment Configuration

### Create Environment File
Copy `.env.example` to `.env` and configure:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=warung_telegram
DATABASE_URL=postgresql://your_db_user:your_db_password@localhost:5432/warung_telegram

# Application Configuration
NODE_ENV=production
PORT=3000

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id
SUPER_ADMIN_TELEGRAM_ID=your_admin_telegram_id

# Cloudflare R2 Configuration
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.r2.dev
```

<<<<<<< HEAD
## Step 2: Database Setup

1. Create a PostgreSQL database in Sevalla.com
2. Note down the connection details
3. Update the `DATABASE_URL` environment variable

## Step 3: Cloudflare R2 Setup

1. Create a Cloudflare R2 bucket
2. Generate R2 API tokens with read/write permissions
3. Configure your bucket for public access (optional, for image serving)
4. Update the R2 environment variables

## Step 4: Deployment Files

### Dockerfile (Already created)
The `Dockerfile` is optimized for production deployment with:
- Multi-stage build for smaller image size
- Non-root user for security
- Proper signal handling with dumb-init
- Alpine Linux for minimal footprint

### .dockerignore (Already configured)
Excludes unnecessary files while including build requirements.

## Step 5: Deploy to Sevalla.com

### Using Git Deployment:
1. Push your code to a Git repository
2. Connect the repository to your Sevalla.com project
3. Sevalla will automatically build and deploy using the Dockerfile

### Using Docker Registry:
1. Build the image locally:
   ```bash
   docker build -t warung-telegram-bot .
   ```

2. Tag for your registry:
   ```bash
   docker tag warung-telegram-bot your-registry/warung-telegram-bot:latest
   ```

3. Push to registry:
   ```bash
   docker push your-registry/warung-telegram-bot:latest
   ```

4. Deploy in Sevalla using the pushed image

## Step 6: Health Check

The application exposes:
- Health endpoint: `GET /health`
- Default port: 3000

Configure Sevalla's health checks to monitor the `/health` endpoint.
=======
## Step 3: Database Setup

### Create Database and User
```sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql

-- Create database user
CREATE USER warung_user WITH PASSWORD 'your_secure_password';

-- Create database
CREATE DATABASE warung_telegram OWNER warung_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE warung_telegram TO warung_user;

-- Exit PostgreSQL
\q
```

## Step 4: Application Deployment

### Clone and Setup
```bash
# Clone your repository
git clone https://github.com/your-username/warung_telegram.git
cd warung_telegram

# Install dependencies
npm install

# Build the application
npm run build

# Copy environment file
cp .env.example .env
# Edit .env with your actual values
nano .env
```

### Test the Application
```bash
# Test with development server
npm run start:dev

# Test with production server
npm run start:server

# Check health
npm run health
```

## Step 5: Production Deployment

### Using PM2 (Recommended)

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'warung-telegram-bot',
    script: 'server.mjs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start with PM2:
```bash
# Create logs directory
mkdir logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Using systemd Service

Create `/etc/systemd/system/warung-telegram.service`:
```ini
[Unit]
Description=Warung Telegram Bot
After=network.target postgresql.service

[Service]
Type=simple
User=nodeuser
WorkingDirectory=/path/to/warung_telegram
ExecStart=/usr/bin/node server.mjs
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/path/to/warung_telegram/.env

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable warung-telegram
sudo systemctl start warung-telegram
```

## Step 6: Reverse Proxy Setup (Optional)

### Using Nginx
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
>>>>>>> b826ffe (try remove docker)

## Step 7: Telegram Webhook Setup

After deployment, set up the Telegram webhook:

```bash
curl -X POST "https://api.telegram.org/bot{BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
<<<<<<< HEAD
  -d '{"url": "https://your-sevalla-domain.com/telegram/webhook"}'
```

Replace:
- `{BOT_TOKEN}` with your actual bot token
- `your-sevalla-domain.com` with your Sevalla domain

## Features Included

### Core Features:
- ✅ Telegram bot integration with Telegraf
- ✅ Product management (CRUD operations)
- ✅ User registration and management
- ✅ Shopping cart functionality
- ✅ Order processing and management
- ✅ Bank account management for payments
- ✅ Image upload and storage with Cloudflare R2

### Bot Commands:
- `/start` - Start the bot and register user
- `/products` - Browse available products
- `/cart` - View and manage shopping cart
- `/orders` - View order history
- `/help` - Show available commands

### Admin Features:
- Product management via HTTP endpoints
- Order tracking and management
- User analytics
- Bank account configuration

## Monitoring and Logs

### Application Logs:
The application uses NestJS's built-in logger. Check Sevalla's log viewer for:
- Application startup logs
- Error logs
- Database connection status
- Telegram webhook events

### Health Monitoring:
Monitor these endpoints:
- `GET /health` - Application health
- Database connectivity
- R2 storage connectivity

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **Database**: Use strong passwords and enable SSL
3. **R2 Bucket**: Configure appropriate CORS and access policies
4. **Telegram**: Validate webhook requests
5. **Docker**: Application runs as non-root user

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**:
   - Check DATABASE_URL format
   - Verify database server is running
   - Check firewall rules

2. **Telegram Webhook Not Working**:
   - Verify webhook URL is accessible
   - Check bot token validity
   - Ensure HTTPS is enabled

3. **R2 Upload Failed**:
   - Verify R2 credentials
   - Check bucket permissions
   - Validate endpoint URL

4. **Application Won't Start**:
   - Check environment variables
   - Review application logs
   - Verify Docker image build

### Debugging Commands:

```bash
# Check container logs
docker logs container-name

# Test database connection
docker exec -it container-name npm run typeorm:cli -- connection:show

# Test R2 connectivity
curl -X GET "https://your-sevalla-domain.com/health"
```

## Production Optimizations

1. **Database**:
   - Enable connection pooling
   - Configure read replicas if needed
   - Set up database backups

2. **Caching**:
   - Consider Redis for session storage
   - Cache frequently accessed data

3. **Monitoring**:
   - Set up application metrics
   - Configure alerts for errors
   - Monitor resource usage

4. **Scaling**:
   - Configure horizontal scaling in Sevalla
   - Set up load balancing if needed

## Support

For deployment issues:
1. Check Sevalla.com documentation
2. Review application logs
3. Test components individually
4. Contact Sevalla support if needed

## Version Information

- Node.js: 20 (Alpine)
- NestJS: Latest
- TypeScript: Latest
- PostgreSQL: Compatible with all versions
- Docker: Multi-stage build optimized

This deployment is production-ready and includes all necessary optimizations for Sevalla.com hosting.
=======
  -d '{"url": "https://your-domain.com/telegram/webhook"}'
```

## Monitoring and Maintenance

### PM2 Commands
```bash
# View running processes
pm2 list

# View logs
pm2 logs warung-telegram-bot

# Restart application
pm2 restart warung-telegram-bot

# Stop application
pm2 stop warung-telegram-bot

# Monitor resources
pm2 monit
```

### Health Checks
```bash
# Application health
npm run health

# Check if service is running
curl http://localhost:3000/health

# Check logs
tail -f logs/combined.log
```

### Database Maintenance
```bash
# Backup database
pg_dump -U warung_user -h localhost warung_telegram > backup.sql

# Restore database
psql -U warung_user -h localhost warung_telegram < backup.sql
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 3000
   sudo lsof -i :3000
   
   # Kill process
   sudo kill -9 <PID>
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   psql -U warung_user -h localhost -d warung_telegram
   
   # Check PostgreSQL status
   sudo systemctl status postgresql
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R nodeuser:nodeuser /path/to/warung_telegram
   chmod +x server.mjs start.sh
   ```

4. **Memory Issues**
   ```bash
   # Check memory usage
   free -h
   
   # Restart PM2 process
   pm2 restart warung-telegram-bot
   ```

### Logs Locations
- PM2 logs: `./logs/` directory
- systemd logs: `journalctl -u warung-telegram`
- Application logs: Console output

## Security Considerations

1. **Environment Variables**: Never commit `.env` to version control
2. **Database**: Use strong passwords and restrict network access
3. **User Permissions**: Run application as non-root user
4. **Firewall**: Only open necessary ports (3000, 22, 80, 443)
5. **Updates**: Keep Node.js and dependencies updated

## Performance Optimization

### Node.js Optimization
```bash
# Set memory limit
export NODE_OPTIONS="--max-old-space-size=512"

# Enable production optimizations
export NODE_ENV=production
```

### Database Optimization
```sql
-- Optimize PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
SELECT pg_reload_conf();
```

## Backup Strategy

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U warung_user -h localhost warung_telegram > "backup_${DATE}.sql"
aws s3 cp "backup_${DATE}.sql" s3://your-backup-bucket/
rm "backup_${DATE}.sql"
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

This deployment guide provides a complete setup for running the Warung Telegram Bot directly on a server without Docker containerization.
>>>>>>> b826ffe (try remove docker)

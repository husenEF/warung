# Production Server Guide - server.mjs

## Overview

The `server.mjs` provides a robust production server wrapper for the Warung Telegram Bot with enhanced features for production deployment.

## Features

### 🔧 Production-Ready Features
- **Environment validation** - Checks required environment variables on startup
- **Graceful shutdown** - Properly handles SIGTERM, SIGINT, and SIGUSR2 signals
- **Error handling** - Catches uncaught exceptions and unhandled promise rejections
- **Health checks** - Built-in health monitoring endpoint
- **Memory optimization** - Configures Node.js memory settings
- **Process monitoring** - Monitors child process and restarts if needed

### 📊 Monitoring & Logging
- Startup validation logs
- Environment configuration display
- Graceful shutdown logging
- Error tracking and reporting
- Health status reporting

## Usage

### 1. Local Development
```bash
# Build the application first
npm run build

# Start with production server
npm run start:server

# Check health status
npm run health
```

### 2. Using Startup Script
```bash
# Make executable (if not already)
chmod +x start.sh

# Start with validation
./start.sh
```

### 3. Production Deployment
```bash
# Build the application
npm run build

# Start with production server
npm run start:server

# Using PM2 for process management
pm2 start ecosystem.config.js

# Using systemd service
sudo systemctl start warung-telegram
```

## Environment Variables

### Required Variables
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

### Optional Variables
```env
NODE_ENV=production          # Default: production
PORT=3000                   # Default: 3000
NODE_OPTIONS=--max-old-space-size=512  # Memory optimization
```

### Cloudflare R2 (Required for image uploads)
```env
CLOUDFLARE_R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.r2.dev
```

## Commands

### Available npm Scripts
```bash
npm run start:server    # Start production server
npm run health         # Check health status
npm run start:dev      # Development mode
npm run start:prod     # Direct NestJS production start
npm run build          # Build application
```

### Server Commands
```bash
# Start server
node server.mjs

# Health check
node server.mjs --health

# With environment file
node server.mjs --env-file .env
```

## Health Checks

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2025-08-14T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 45678,
    "heapTotal": 25678,
    "heapUsed": 18234,
    "external": 1234
  },
  "env": "production",
  "version": "0.0.1"
}
```

### Health Check Endpoints
- **Command Line**: `npm run health`
- **Process Manager**: `pm2 logs` for monitoring
- **HTTP**: The main app provides `/health` endpoint via NestJS

## Graceful Shutdown

The server handles shutdown gracefully:

1. **Signal Reception** - Listens for SIGTERM, SIGINT, SIGUSR2
2. **Shutdown Initiation** - Logs shutdown start
3. **App Termination** - Sends SIGTERM to NestJS app
4. **Timeout Protection** - Force kills after 10 seconds if needed
5. **Clean Exit** - Exits with appropriate code

### Manual Shutdown
```bash
# Graceful shutdown
kill -TERM <pid>

# Force shutdown (if needed)
kill -KILL <pid>
```

## Error Handling

### Automatic Error Recovery
- **Uncaught Exceptions** - Logged and triggers graceful shutdown
- **Unhandled Rejections** - Logged and triggers graceful shutdown
- **Child Process Errors** - Logged and exits with error code
- **Startup Failures** - Environment validation prevents startup

### Error Logs
```
💥 Uncaught Exception: Error message
💥 Unhandled Rejection at: Promise, reason: Error
💥 Failed to start application: Error details
💥 Application exited unexpectedly with code 1
```

## Production Deployment

### VPS/Cloud Server
```bash
# Direct deployment on VPS
# Follow DEPLOYMENT.md guide for complete setup
```

### PM2 (Alternative)
```json
{
  "name": "warung-telegram",
  "script": "server.mjs",
  "instances": 1,
  "exec_mode": "fork",
  "env": {
    "NODE_ENV": "production",
    "PORT": 3000
  }
}
```

### systemd Service
```ini
[Unit]
Description=Warung Telegram Bot
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/app
ExecStart=/usr/bin/node server.mjs
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## Monitoring

### Log Monitoring
```bash
# PM2 logs
pm2 logs warung-telegram

# Follow logs with timestamps
pm2 logs warung-telegram --timestamp

# System logs (systemd)
journalctl -u warung-telegram -f
```

### Health Monitoring
```bash
# Continuous health check
watch -n 30 'npm run health'

# PM2 process monitoring
pm2 monit
```

## Troubleshooting

### Common Issues

1. **Environment Variables Missing**
   ```
   ❌ Missing required environment variables:
      - TELEGRAM_BOT_TOKEN
   ```
   **Solution**: Set all required environment variables

2. **Port Already in Use**
   ```
   Error: listen EADDRINUSE :::3000
   ```
   **Solution**: Change PORT environment variable or stop conflicting service

3. **Database Connection Failed**
   ```
   Unable to connect to the database
   ```
   **Solution**: Verify DATABASE_URL and database accessibility

4. **Memory Issues**
   ```
   JavaScript heap out of memory
   ```
   **Solution**: Increase NODE_OPTIONS memory limit

### Debug Mode
```bash
# Enable debug logging
DEBUG=* node server.mjs

# Node.js debug mode
node --inspect server.mjs
```

## Performance Optimization

### Memory Settings
```bash
# Optimize for containers (512MB)
NODE_OPTIONS="--max-old-space-size=512"

# Optimize for VPS (1GB)
NODE_OPTIONS="--max-old-space-size=1024"
```

### Process Monitoring
- Child process monitoring with restart capability
- Memory usage tracking in health checks
- Automatic cleanup on shutdown

## Security

### Process Security
- Runs as specified user (not root in production)
- Environment variable validation
- Graceful error handling without sensitive data exposure

### Signal Handling
- Proper signal handling for container orchestration
- Clean shutdown prevents data corruption
- Timeout protection prevents hanging processes

---

This production server provides enterprise-grade reliability and monitoring for your Warung Telegram Bot deployment.

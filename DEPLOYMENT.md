# Warung Telegram Bot - Sevalla.com Deployment Guide

## Overview
This guide helps you deploy the Warung Telegram Bot to Sevalla.com using Docker.

## Prerequisites
- Sevalla.com account
- PostgreSQL database (Sevalla provides database services)
- Telegram Bot Token (get from @BotFather)
- Cloudflare R2 bucket (for image storage)

## Step 1: Environment Variables

Create the following environment variables in your Sevalla.com project:

```env
NODE_ENV=production
PORT=3000
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
DATABASE_URL=postgresql://username:password@host:port/database_name
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.r2.dev
```

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

## Step 7: Telegram Webhook Setup

After deployment, set up the Telegram webhook:

```bash
curl -X POST "https://api.telegram.org/bot{BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
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

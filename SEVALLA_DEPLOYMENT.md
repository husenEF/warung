# Sevalla.com Deployment Guide

This guide will help you deploy your Telegram Warung Bot to Sevalla.com using Docker.

## Prerequisites

1. **Sevalla Account**: Sign up at [sevalla.com](https://sevalla.com)
2. **Cloudflare R2 Setup**: Complete R2 configuration (see CLOUDFLARE_R2_SETUP.md)
3. **Telegram Bot Token**: Get from @BotFather on Telegram
4. **Database**: PostgreSQL database (Sevalla provides managed databases)

## Step 1: Prepare Your Environment Variables

Create a `.env` file with your production values:

```bash
# Database Configuration (Sevalla Managed Database)
DATABASE_HOST=your-postgres-host.sevalla.com
DATABASE_PORT=5432
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=warung_telegram

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Cloudflare R2 Configuration
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=warung-telegram
R2_PUBLIC_URL=https://your-custom-domain.com

# Application Port (Sevalla assigns this)
PORT=3000
```

## Step 2: Set Up Database on Sevalla

1. **Create PostgreSQL Database**:
   - Go to Sevalla Dashboard → Databases
   - Create new PostgreSQL database
   - Note the connection details

2. **Update Environment Variables**:
   - Use the provided database host, user, and password
   - Update your `.env` file with these values

## Step 3: Deploy to Sevalla

### Option A: Deploy from Git Repository

1. **Push to Git Repository**:
   ```bash
   git add .
   git commit -m "Prepare for Sevalla deployment"
   git push origin main
   ```

2. **Create New App on Sevalla**:
   - Go to Sevalla Dashboard → Apps
   - Click "Create New App"
   - Connect your Git repository
   - Choose "Docker" as deployment method

3. **Configure Environment Variables**:
   - In Sevalla app settings, add all environment variables
   - Use the "Environment Variables" section
   - Don't include sensitive values in your code

### Option B: Deploy with Docker

1. **Build and Push Docker Image**:
   ```bash
   # Build the image
   docker build -t warung-telegram .
   
   # Tag for your registry
   docker tag warung-telegram your-registry/warung-telegram
   
   # Push to registry
   docker push your-registry/warung-telegram
   ```

2. **Deploy on Sevalla**:
   - Use the pushed image in Sevalla deployment
   - Configure environment variables in Sevalla dashboard

## Step 4: Configure Sevalla App Settings

### Application Configuration

1. **Port Configuration**:
   - Sevalla will automatically assign a port
   - Your app should listen on `process.env.PORT || 3000`

2. **Health Check**:
   - Sevalla will use the `/health` endpoint
   - This is already configured in the app

3. **Resource Allocation**:
   - Recommended: 512MB RAM minimum
   - 1 CPU core should be sufficient for small to medium usage

### Domain Configuration

1. **Custom Domain** (Optional):
   - Add your domain in Sevalla dashboard
   - Configure DNS records as instructed
   - Enable SSL (automatic with Sevalla)

## Step 5: Database Migration

After deployment, run database migrations:

1. **Access App Terminal** (via Sevalla dashboard):
   ```bash
   npm run typeorm:migration:run
   ```

2. **Or use Docker exec**:
   ```bash
   docker exec -it warung_telegram_prod npm run typeorm:migration:run
   ```

## Step 6: Verify Deployment

1. **Check Application Status**:
   - Visit your app URL
   - Check `/health` endpoint returns `{"status":"ok"}`

2. **Test Telegram Bot**:
   - Send `/start` command to your bot
   - Try adding products with images
   - Verify images are stored in R2 and display correctly

3. **Monitor Logs**:
   - Use Sevalla dashboard to view application logs
   - Check for any errors or warnings

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_HOST` | PostgreSQL host | `postgres.sevalla.com` |
| `DATABASE_PORT` | Database port | `5432` |
| `DATABASE_USER` | Database username | `warung_user` |
| `DATABASE_PASSWORD` | Database password | `secure_password` |
| `DATABASE_NAME` | Database name | `warung_telegram` |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | `123456:ABC-DEF...` |
| `R2_ENDPOINT` | R2 endpoint URL | `https://abc123.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | R2 access key | `your_access_key` |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | `your_secret_key` |
| `R2_BUCKET_NAME` | R2 bucket name | `warung-telegram` |
| `R2_PUBLIC_URL` | R2 public URL | `https://images.yourdomain.com` |
| `PORT` | Application port | `3000` |

## Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Verify database credentials
   - Check if database is running
   - Ensure network connectivity

2. **Telegram Bot Not Responding**:
   - Verify bot token is correct
   - Check if webhook is properly set
   - Review application logs

3. **Images Not Uploading**:
   - Verify R2 credentials
   - Check bucket permissions
   - Ensure R2 endpoint is correct

4. **App Not Starting**:
   - Check application logs in Sevalla dashboard
   - Verify all environment variables are set
   - Ensure Dockerfile builds successfully

### Useful Commands

```bash
# View application logs
docker logs warung_telegram_prod

# Access container terminal
docker exec -it warung_telegram_prod sh

# Restart application
docker restart warung_telegram_prod

# Check database connection
docker exec -it warung_telegram_prod npm run typeorm:migration:show
```

## Security Best Practices

1. **Environment Variables**:
   - Never commit sensitive data to Git
   - Use Sevalla's environment variable management
   - Rotate secrets regularly

2. **Database Security**:
   - Use strong passwords
   - Enable SSL connections
   - Regularly backup data

3. **Image Storage**:
   - Configure R2 bucket policies properly
   - Use custom domain for better security
   - Monitor usage and costs

## Scaling Considerations

- **Traffic Growth**: Sevalla can auto-scale your application
- **Database**: Consider read replicas for heavy read workloads
- **Storage**: R2 scales automatically with usage
- **Monitoring**: Set up alerts for errors and performance metrics

## Cost Optimization

- **Resource Sizing**: Start small and scale as needed
- **Database**: Use appropriate instance size
- **R2 Storage**: Monitor usage, set up lifecycle policies
- **Sevalla Credits**: Take advantage of free tier when available

Your Telegram Warung Bot should now be successfully deployed on Sevalla.com with cloud storage via Cloudflare R2!

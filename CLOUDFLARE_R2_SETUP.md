# Cloudflare R2 Setup Guide

This guide will help you set up Cloudflare R2 storage for your Telegram bot to store product images.

## Prerequisites

1. A Cloudflare account
2. A domain (optional, for custom domain)

## Step 1: Create R2 Bucket

1. Log in to your Cloudflare dashboard
2. Go to R2 Object Storage
3. Click "Create bucket"
4. Name your bucket (e.g., `warung-telegram`)
5. Choose a location close to your users
6. Click "Create bucket"

## Step 2: Get API Credentials

1. Go to "My Profile" → "API Tokens"
2. Click "Create Token"
3. Use "Custom token" template
4. Configure permissions:
   - Zone: Zone:Read (for your domain)
   - Account: Cloudflare R2:Edit
5. Add account resources: Include your account
6. Click "Continue to summary" and "Create Token"
7. Copy your API token

## Step 3: Create R2 API Token

1. In Cloudflare dashboard, go to R2 Object Storage
2. Click "Manage R2 API tokens"
3. Click "Create API token"
4. Choose permissions: "Object Read & Write"
5. Optional: Add IP restrictions
6. Click "Create API token"
7. Copy the Access Key ID and Secret Access Key

## Step 4: Configure Environment Variables

Add these variables to your `.env` file:

```bash
# Cloudflare R2 Configuration
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=warung-telegram
R2_PUBLIC_URL=https://pub-your-bucket-hash.r2.dev
```

### Getting your Account ID and Endpoint

1. In Cloudflare dashboard, go to R2 Object Storage
2. Your Account ID is displayed in the sidebar
3. Your endpoint will be: `https://your-account-id.r2.cloudflarestorage.com`

### Getting your Public URL

Option 1: Use default R2 domain
- Go to your bucket settings
- Enable "Public access"
- Copy the public bucket URL (looks like `https://pub-xxxxxxxxx.r2.dev`)

Option 2: Use custom domain (recommended)
- Add a custom domain in your bucket settings
- Configure DNS CNAME record pointing to your R2 bucket
- Use your custom domain as R2_PUBLIC_URL

## Step 5: Database Migration

Run the migration to add the new `imageKey` column to your products table:

```bash
npm run typeorm:migration:generate -- -n AddImageKeyToProduct
npm run typeorm:migration:run
```

## Step 6: Test the Setup

1. Start your application: `npm run start:dev`
2. Try adding a product with an image through your Telegram bot
3. Check if the image appears in your R2 bucket
4. Verify the image displays correctly in the catalog

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check your API credentials and permissions
2. **CORS errors**: Configure CORS policy in your R2 bucket if accessing from web
3. **Images not displaying**: Verify your public URL and bucket public access settings

### CORS Configuration (if needed)

In your R2 bucket settings, add CORS policy:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"]
  }
]
```

### Bucket Policy for Public Access

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::warung-telegram/*"
    }
  ]
}
```

## Cost Considerations

- Cloudflare R2 offers 10GB free storage per month
- No egress charges for data served to the internet
- Very cost-effective compared to other cloud storage providers

## Security Best Practices

1. Use least-privilege API tokens
2. Enable IP restrictions if possible
3. Monitor usage and costs regularly
4. Consider implementing image size limits
5. Use custom domain for better security and branding

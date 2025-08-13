#!/bin/bash

# Deployment script for Sevalla.com
set -e

echo "🚀 Deploying Warung Telegram Bot to Sevalla..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create .env file with your configuration."
    echo "📝 Use .env.example as a template."
    exit 1
fi

# Check if required environment variables are set
required_vars=("TELEGRAM_BOT_TOKEN" "DATABASE_HOST" "DATABASE_USER" "DATABASE_PASSWORD" "R2_ENDPOINT" "R2_ACCESS_KEY_ID" "R2_SECRET_ACCESS_KEY")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        echo "📝 Please check your .env file"
        exit 1
    fi
done

echo "✅ Environment variables check passed"

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t warung-telegram:latest .

echo "✅ Docker image built successfully"

# Test the build
echo "🧪 Testing Docker image..."
docker run --rm --env-file .env -p 3001:3000 -d --name warung-test warung-telegram:latest

# Wait a bit for the container to start
sleep 10

# Check if the container is running
if docker ps | grep -q warung-test; then
    echo "✅ Container is running"
    
    # Test health endpoint
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Health check passed"
    else
        echo "⚠️  Health check failed, but container is running"
    fi
    
    # Stop test container
    docker stop warung-test
else
    echo "❌ Container failed to start"
    docker logs warung-test
    exit 1
fi

echo "🎉 Deployment preparation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to Git repository"
echo "2. Create new app on Sevalla.com"
echo "3. Connect your repository"
echo "4. Set environment variables in Sevalla dashboard"
echo "5. Deploy!"
echo ""
echo "📖 See SEVALLA_DEPLOYMENT.md for detailed instructions"

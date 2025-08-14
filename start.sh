#!/bin/bash

# Warung Telegram Bot - Production Startup Script

set -e

echo "🚀 Warung Telegram Bot - Production Startup"
echo "============================================"

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if dist directory exists
if [[ ! -d "dist" ]]; then
    echo "📦 Building application..."
    npm run build
else
    echo "✅ Build directory found"
fi

# Check if server.mjs exists
if [[ ! -f "server.mjs" ]]; then
    echo "❌ Error: server.mjs not found. Please ensure it exists in the project root."
    exit 1
fi

# Load environment variables if .env file exists
if [[ -f ".env" ]]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Validate required environment variables
required_vars=("TELEGRAM_BOT_TOKEN" "DATABASE_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        missing_vars+=("$var")
    fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
    echo "❌ Missing required environment variables:"
    printf '   - %s\n' "${missing_vars[@]}"
    echo ""
    echo "Please set these environment variables before starting the server."
    echo "You can create a .env file or export them directly."
    exit 1
fi

echo "✅ Environment validation passed"
echo "📡 Port: ${PORT:-3000}"
echo "🤖 Telegram bot configured"
echo "🗄️ Database connection configured"

# Start the server
echo ""
echo "🔥 Starting production server..."
echo "Press Ctrl+C to stop"
echo ""

exec npm run start:server

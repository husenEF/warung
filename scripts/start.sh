#!/bin/sh

# Startup script for production deployment
set -e

echo "🚀 Starting Warung Telegram Bot..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until node -e "
const { createConnection } = require('typeorm');
createConnection({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
}).then(() => {
  console.log('✅ Database connected');
  process.exit(0);
}).catch((err) => {
  console.log('❌ Database connection failed:', err.message);
  process.exit(1);
});
" 2>/dev/null; do
  echo "⏳ Database not ready, waiting 5 seconds..."
  sleep 5
done

# Run database migrations
echo "🔄 Running database migrations..."
npm run typeorm:migration:run || echo "⚠️  No migrations to run or migration failed"

# Start the application
echo "✅ Starting application..."
exec node dist/src/main.js

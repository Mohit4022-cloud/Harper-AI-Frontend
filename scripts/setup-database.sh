#!/bin/bash

# Database Setup Script for Harper AI
# This script sets up the database with Prisma migrations

set -e

echo "🚀 Harper AI Database Setup"
echo "=========================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Creating .env from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please update DATABASE_URL before continuing."
        exit 1
    else
        echo "❌ Error: .env.example not found either"
        exit 1
    fi
fi

# Source environment variables
source .env

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env file"
    echo "Please set DATABASE_URL to your PostgreSQL connection string"
    echo "Example: DATABASE_URL=\"postgresql://user:password@localhost:5432/harper_ai\""
    exit 1
fi

echo "📊 Database URL configured"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Seed database (optional)
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
else
    echo "ℹ️  No seed file found, skipping seeding"
fi

# Show migration status
echo ""
echo "📋 Migration Status:"
npx prisma migrate status

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with production values"
echo "2. Run 'npm run dev' to start the development server"
echo "3. The app will now use real database authentication"
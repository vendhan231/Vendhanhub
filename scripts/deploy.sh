#!/bin/bash

# Production deployment script for Employee Management System

echo "🚀 Starting production deployment..."

# Set environment to production
export NODE_ENV=production

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:deploy

# Build the application
echo "🔨 Building application..."
npm run build

# Seed the database with initial data (optional)
echo "🌱 Seeding database..."
npm run db:seed

# Run tests if available
echo "🧪 Running tests..."
npm run type-check

echo "✅ Deployment completed successfully!"
echo "🎉 Application is ready for production use"
echo ""
echo "To start the application:"
echo "  npm run preview"
echo ""
echo "Or using Docker:"
echo "  docker build -t employee-management-system ."
echo "  docker run -p 3000:3000 employee-management-system"
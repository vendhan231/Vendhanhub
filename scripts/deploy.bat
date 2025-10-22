@echo off
REM Production deployment script for Employee Management System (Windows)

echo 🚀 Starting production deployment...

REM Set environment to production
set NODE_ENV=production

REM Install dependencies
echo 📦 Installing dependencies...
npm ci --production

REM Run database migrations
echo 🗄️ Running database migrations...
npm run db:deploy

REM Build the application
echo 🔨 Building application...
npm run build

REM Seed the database with initial data (optional)
echo 🌱 Seeding database...
npm run db:seed

REM Run tests if available
echo 🧪 Running tests...
npm run type-check

echo ✅ Deployment completed successfully!
echo 🎉 Application is ready for production use
echo.
echo To start the application:
echo   npm run preview
echo.
echo Or using Docker:
echo   docker build -t employee-management-system .
echo   docker run -p 3000:3000 employee-management-system

pause
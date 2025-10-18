@echo off
REM PostgreSQL Setup Script for Employee Management System (Windows)
REM Run this script to set up your PostgreSQL database

echo 🚀 Setting up PostgreSQL database for Employee Management System...

REM Database configuration from your .env file
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=EMS
set DB_USER=postgres
set DB_PASSWORD=vendhan@123

echo 📋 Database Configuration:
echo    Host: %DB_HOST%
echo    Port: %DB_PORT%
echo    Database: %DB_NAME%
echo    Username: %DB_USER%
echo    Password: [HIDDEN]

REM Check if PostgreSQL is running
echo 🔍 Checking PostgreSQL service status...
pg_isready -h %DB_HOST% -p %DB_PORT% >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL is not running on %DB_HOST%:%DB_PORT%
    echo 💡 Please start PostgreSQL service:
    echo    - Open Services (services.msc)
    echo    - Find "PostgreSQL" service
    echo    - Right-click and select "Start"
    echo.
    echo    Or run in Command Prompt as Administrator:
    echo    net start postgresql-x64-15
    pause
    exit /b 1
)

echo ✅ PostgreSQL is running

REM Create database if it doesn't exist
echo 🔍 Checking if database '%DB_NAME%' exists...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -lqt | findstr /C:"%DB_NAME%" >nul
if not errorlevel 1 (
    echo ✅ Database '%DB_NAME%' already exists
) else (
    echo 📦 Creating database '%DB_NAME%'...
    set PGPASSWORD=%DB_PASSWORD%
    createdb -h %DB_HOST% -p %DB_PORT% -U %DB_USER% %DB_NAME%

    if errorlevel 1 (
        echo ❌ Failed to create database
        echo 💡 Please check your credentials in employee-management-billing-backend\.env
        pause
        exit /b 1
    ) else (
        echo ✅ Database '%DB_NAME%' created successfully
    )
)

REM Test connection
echo 🔗 Testing database connection...
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 1;" >nul 2>&1

if errorlevel 1 (
    echo ❌ Database connection failed
    echo 💡 Please check your credentials in employee-management-billing-backend\.env
    pause
    exit /b 1
) else (
    echo ✅ Database connection successful
)

echo.
echo 🎉 PostgreSQL setup completed successfully!
echo.
echo 📋 Next steps:
echo    1. Run database migrations:
echo       cd employee-management-billing-backend
echo       npm run migrate
echo.
echo    2. Generate Prisma client:
echo       npm run generate
echo.
echo    3. Seed users:
echo       npm run seed
echo.
echo    4. Start the backend server:
echo       npm run dev
echo.
echo 🚀 Your Employee Management System is ready!
echo.
pause
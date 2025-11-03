#!/bin/bash

# PostgreSQL Setup Script for Employee Management System
# Run this script to set up your PostgreSQL database

echo "🚀 Setting up PostgreSQL database for Employee Management System..."

# Database configuration from your .env file
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="EMS"
DB_USER="postgres"
DB_PASSWORD="vendhan@123"

echo "📋 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   Username: $DB_USER"
echo "   Password: [HIDDEN]"

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT; then
    echo "❌ PostgreSQL is not running on $DB_HOST:$DB_PORT"
    echo "💡 Please start PostgreSQL service:"
    echo "   - On Windows: Start PostgreSQL service from Services"
    echo "   - On Linux: sudo systemctl start postgresql"
    echo "   - On macOS: brew services start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Create database if it doesn't exist
echo "🔍 Checking if database '$DB_NAME' exists..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "✅ Database '$DB_NAME' already exists"
else
    echo "📦 Creating database '$DB_NAME'..."
    PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME

    if [ $? -eq 0 ]; then
        echo "✅ Database '$DB_NAME' created successfully"
    else
        echo "❌ Failed to create database"
        exit 1
    fi
fi

# Test connection
echo "🔗 Testing database connection..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "💡 Please check your credentials in employee-management-billing-backend/.env"
    exit 1
fi

echo ""
echo "🎉 PostgreSQL setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Run database migrations:"
echo "      cd employee-management-billing-backend"
echo "      npm run migrate"
echo ""
echo "   2. Generate Prisma client:"
echo "      npm run generate"
echo ""
echo "   3. Seed users:"
echo "      npm run seed"
echo ""
echo "   4. Start the backend server:"
echo "      npm run dev"
echo ""
echo "🚀 Your Employee Management System is ready!"
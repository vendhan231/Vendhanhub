#!/bin/bash

# Production Setup Script for Employee Management System
# This script helps configure the application for production deployment

set -e

echo "🚀 Setting up Employee Management System for Production"
echo "======================================================"

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -f "vite.config.ts" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local response

    read -p "$prompt [$default]: " response
    echo "${response:-$default}"
}

# Function to generate secure random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

echo "📋 Step 1: Environment Configuration"
echo "-----------------------------------"

# Database Configuration
echo "Database Configuration:"
DB_TYPE=$(prompt_with_default "Database type (postgresql/sqlite)" "postgresql")
if [ "$DB_TYPE" = "postgresql" ]; then
    DB_HOST=$(prompt_with_default "Database host" "localhost")
    DB_PORT=$(prompt_with_default "Database port" "5432")
    DB_NAME=$(prompt_with_default "Database name" "employee_db")
    DB_USER=$(prompt_with_default "Database username" "employee_user")
    DB_PASS=$(prompt_with_default "Database password" "$(generate_secret)")
    DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"
else
    DATABASE_URL="file:./dev.db"
fi

# JWT Secret
JWT_SECRET=$(generate_secret)

# API Keys
GEMINI_API_KEY=$(prompt_with_default "Gemini API Key (leave empty if not using AI features)" "")

# Supabase Configuration (optional)
USE_SUPABASE=$(prompt_with_default "Use Supabase? (y/n)" "n")
if [ "$USE_SUPABASE" = "y" ]; then
    VITE_SUPABASE_URL=$(prompt_with_default "Supabase URL" "")
    VITE_SUPABASE_ANON_KEY=$(prompt_with_default "Supabase Anon Key" "")
fi

# Domain Configuration
DOMAIN=$(prompt_with_default "Domain name (without https://)" "localhost")
SSL_ENABLED=$(prompt_with_default "Enable SSL/HTTPS? (y/n)" "y")

# Email Configuration (optional)
USE_EMAIL=$(prompt_with_default "Configure email notifications? (y/n)" "n")
if [ "$USE_EMAIL" = "y" ]; then
    SMTP_HOST=$(prompt_with_default "SMTP Host" "smtp.gmail.com")
    SMTP_PORT=$(prompt_with_default "SMTP Port" "587")
    SMTP_USER=$(prompt_with_default "SMTP Username" "")
    SMTP_PASS=$(prompt_with_default "SMTP Password/App Password" "")
fi

echo ""
echo "📝 Step 2: Creating Production Environment Files"
echo "------------------------------------------------"

# Create .env.production for frontend
cat > .env.production << EOF
# Production Environment Variables - Frontend
NODE_ENV=production

# Supabase Configuration
VITE_SUPABASE_URL=$VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# API Configuration
VITE_API_BASE_URL=https://$DOMAIN/api/v1

# Application Configuration
VITE_APP_NAME="Employee Management System"
VITE_APP_VERSION="1.0.0"
EOF

# Create .env for backend
cat > employee-management-billing-backend/.env.production << EOF
# Production Environment Variables - Backend
NODE_ENV=production

# Database Configuration
DATABASE_URL=$DATABASE_URL

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# AI Configuration
GEMINI_API_KEY=$GEMINI_API_KEY

# Server Configuration
PORT=3001
HOST=0.0.0.0

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN

# Session Configuration
SESSION_SECRET=$(generate_secret)

# Email Configuration
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/var/www/uploads

# Logging Configuration
LOG_LEVEL=info

# SSL Configuration
SSL_ENABLED=$SSL_ENABLED
SSL_CERT_PATH=/etc/ssl/certs/fullchain.pem
SSL_KEY_PATH=/etc/ssl/private/privkey.pem
EOF

echo ""
echo "🐳 Step 3: Docker Compose Configuration"
echo "-------------------------------------"

# Update docker-compose.yml with domain
sed -i "s/your-domain.com/$DOMAIN/g" docker-compose.yml
sed -i "s/your-frontend-domain.com/$DOMAIN/g" docker-compose.yml

if [ "$SSL_ENABLED" = "y" ]; then
    # Enable SSL in nginx configuration
    sed -i 's/# return 301 https:/return 301 https:/g' nginx.conf
    sed -i 's/# server {/server {/g' nginx.conf
    sed -i 's/#     listen 443/#     listen 443/g' nginx.conf
    echo "✅ SSL enabled in nginx configuration"
fi

echo ""
echo "🔐 Step 4: SSL Certificate Setup"
echo "-------------------------------"

if [ "$SSL_ENABLED" = "y" ]; then
    echo "SSL Certificate Setup Instructions:"
    echo "1. Install certbot: apt-get install certbot"
    echo "2. Run: certbot certonly --standalone -d $DOMAIN"
    echo "3. Copy certificates to ./ssl/ directory"
    echo "4. Update nginx.conf with correct certificate paths"
    echo ""
    echo "Alternative: Use Let's Encrypt with Docker:"
    echo "docker run -it --rm -p 80:80 -p 443:443 -v ssl:/etc/letsencrypt certbot/certbot certonly --standalone -d $DOMAIN"
else
    echo "⚠️  SSL disabled. Consider enabling HTTPS for production security."
fi

echo ""
echo "🗄️  Step 5: Database Setup"
echo "-------------------------"

if [ "$DB_TYPE" = "postgresql" ]; then
    echo "PostgreSQL Setup Instructions:"
    echo "1. Install PostgreSQL on your server"
    echo "2. Create database: $DB_NAME"
    echo "3. Create user: $DB_USER with password: $DB_PASS"
    echo "4. Grant permissions to user on database"
    echo ""
    echo "Or use Docker (already configured in docker-compose.yml)"
    echo "docker-compose up -d db"
    echo ""
    echo "Database URL: $DATABASE_URL"
else
    echo "SQLite will be used (file-based database)"
    echo "Data will be stored in: employee-management-billing-backend/prisma/dev.db"
fi

echo ""
echo "🚀 Step 6: Deployment Instructions"
echo "---------------------------------"

echo "1. Build and start services:"
echo "   docker-compose up -d"
echo ""
echo "2. Run database migrations:"
echo "   docker-compose exec backend npx prisma migrate deploy"
echo ""
echo "3. Check application health:"
echo "   curl http://$DOMAIN/health"
echo ""
echo "4. Access application:"
echo "   https://$DOMAIN"
echo ""

echo ""
echo "🔧 Step 7: Monitoring Setup"
echo "---------------------------"

echo "Monitoring Setup Instructions:"
echo "1. Install monitoring tools (optional):"
echo "   - Prometheus: docker run -d -p 9090:9090 prom/prometheus"
echo "   - Grafana: docker run -d -p 3000:3000 grafana/grafana"
echo ""
echo "2. Configure error tracking (Sentry):"
echo "   - Sign up at sentry.io"
echo "   - Add SENTRY_DSN to environment variables"
echo ""
echo "3. Set up log aggregation:"
echo "   - Use ELK stack or similar for log management"

echo ""
echo "💾 Step 8: Backup Strategy"
echo "-------------------------"

echo "Automated Backup Setup:"
echo "1. Database backups:"
echo "   # Add to crontab: 0 2 * * * docker-compose exec db pg_dump -U $DB_USER $DB_NAME > backup_\$(date +\%Y\%m\%d).sql"
echo ""
echo "2. File backups:"
echo "   # Add to crontab: 0 3 * * * tar -czf uploads_backup_\$(date +\%Y\%m\%d).tar.gz uploads/"
echo ""
echo "3. Configuration backups:"
echo "   # Backup environment files and docker-compose.yml"

echo ""
echo "✅ Production Setup Complete!"
echo "=============================="
echo ""
echo "📋 Summary:"
echo "- Domain: $DOMAIN"
echo "- SSL: $SSL_ENABLED"
echo "- Database: $DB_TYPE"
echo "- JWT Secret: Configured"
echo "- Environment files created"
echo ""
echo "🔒 Important: Keep your secrets secure!"
echo "- JWT_SECRET: $JWT_SECRET"
if [ "$DB_TYPE" = "postgresql" ]; then
    echo "- DB_PASSWORD: $DB_PASS"
fi
if [ "$USE_EMAIL" = "y" ]; then
    echo "- SMTP_PASS: $SMTP_PASS"
fi
echo ""
echo "Save these credentials in a secure location!"
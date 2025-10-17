# 🚀 Production Deployment Guide

This guide provides step-by-step instructions for deploying the Employee Management & Billing System to production.

## 📋 Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- Domain name pointed to your server
- SSH access to the server

## 🎯 Quick Deployment (Automated)

### Option 1: Using Setup Scripts (Recommended)

1. **Clone the repository on your server**
   ```bash
   git clone <your-repo-url>
   cd employee-management-system
   ```

2. **Run the production setup script**
   ```bash
   chmod +x scripts/setup-production.sh
   ./scripts/setup-production.sh
   ```

3. **Configure SSL certificates**
   ```bash
   chmod +x scripts/setup-ssl.sh
   ./scripts/setup-ssl.sh
   ```

4. **Set up monitoring (optional)**
   ```bash
   chmod +x scripts/setup-monitoring.sh
   ./scripts/setup-monitoring.sh
   ```

5. **Configure automated backups**
   ```bash
   chmod +x scripts/setup-backups.sh
   ./scripts/setup-backups.sh
   ```

6. **Deploy the application**
   ```bash
   docker-compose up -d
   ```

### Option 2: Manual Deployment

## 📝 Manual Setup Steps

### Step 1: Environment Configuration

1. **Update production environment variables**
   ```bash
   # Copy and edit environment files
   cp .env.example .env.production
   cp employee-management-billing-backend/.env.example employee-management-billing-backend/.env.production

   # Edit with your production values
   nano .env.production
   nano employee-management-billing-backend/.env.production
   ```

2. **Required environment variables:**
   ```env
   # Frontend (.env.production)
   VITE_API_BASE_URL=https://your-api-domain.com/api/v1
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

   # Backend (.env.production)
   NODE_ENV=production
   DATABASE_URL=postgresql://user:password@localhost:5432/employee_db
   JWT_SECRET=your-secure-jwt-secret
   GEMINI_API_KEY=your-gemini-api-key
   PORT=3001
   ```

### Step 2: Database Setup

#### Option A: PostgreSQL with Docker (Recommended)
```bash
# Start only the database
docker-compose up -d db

# Wait for database to be ready
sleep 30

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

#### Option B: External PostgreSQL
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE employee_db;
CREATE USER employee_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE employee_db TO employee_user;
\q

# Update DATABASE_URL in environment files
```

### Step 3: SSL Certificate Setup

#### Using Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt update
sudo apt install certbot

# Stop services using port 80
docker-compose stop nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/

# Set permissions
sudo chmod 644 ./ssl/fullchain.pem
sudo chmod 600 ./ssl/privkey.pem

# Start services
docker-compose up -d
```

#### Using Self-Signed Certificate (Development only)
```bash
# Create ssl directory
mkdir -p ssl

# Generate certificate
openssl req -x509 -newkey rsa:4096 -keyout ssl/privkey.pem -out ssl/fullchain.pem -days 365 -nodes -subj "/CN=localhost"

# Note: Browsers will show security warnings with self-signed certificates
```

### Step 4: Domain Configuration

1. **Update nginx configuration**
   ```bash
   # Edit nginx.conf
   nano nginx.conf

   # Replace yourdomain.com with your actual domain
   sed -i 's/yourdomain.com/your-actual-domain.com/g' nginx.conf
   ```

2. **DNS Configuration**
   - Point your domain A record to your server's IP address
   - For subdomains, create additional A records or CNAME records

### Step 5: Application Deployment

```bash
# Build and start all services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 6: Health Checks

```bash
# Test application endpoints
curl -f https://yourdomain.com/health
curl -f https://yourdomain.com/api/v1/health

# Test SSL certificate
curl -I https://yourdomain.com
```

## 🔧 Post-Deployment Configuration

### Monitoring Setup

1. **Application Monitoring**
   ```bash
   # Start monitoring services
   docker-compose -f docker-compose.monitoring.yml up -d

   # Access Grafana
   # URL: http://your-server-ip:3002
   # Default credentials: admin/admin
   ```

2. **Error Tracking (Sentry)**
   ```bash
   # Add to environment files
   echo "VITE_SENTRY_DSN=your-sentry-dsn" >> .env.production
   echo "SENTRY_DSN=your-sentry-dsn" >> employee-management-billing-backend/.env.production

   # Restart services
   docker-compose restart frontend backend
   ```

### Backup Configuration

```bash
# Run initial backups
./scripts/backup-database.sh
./scripts/backup-files.sh
./scripts/backup-config.sh

# Verify backups
./scripts/verify-backups.sh
```

### SSL Auto-Renewal

```bash
# Add to crontab for automatic renewal
crontab -e

# Add this line (runs twice daily)
0 12,0 * * * /path/to/your/project/scripts/renew-ssl.sh
```

## 🔍 Troubleshooting

### Common Issues

1. **Port 80/443 already in use**
   ```bash
   # Find what's using the ports
   sudo lsof -i :80
   sudo lsof -i :443

   # Stop conflicting services
   sudo systemctl stop apache2
   sudo systemctl stop nginx
   ```

2. **Database connection issues**
   ```bash
   # Check database logs
   docker-compose logs db

   # Test database connection
   docker-compose exec db psql -U postgres -d employee_db -c "SELECT 1;"
   ```

3. **SSL certificate issues**
   ```bash
   # Check certificate validity
   openssl x509 -in ssl/fullchain.pem -text -noout

   # Test SSL configuration
   curl -I https://yourdomain.com
   ```

4. **Application not accessible**
   ```bash
   # Check service status
   docker-compose ps

   # Check application logs
   docker-compose logs frontend
   docker-compose logs backend

   # Test internal connectivity
   docker-compose exec frontend curl http://backend:3001/health
   ```

### Performance Optimization

1. **Database Optimization**
   ```sql
   -- Run these queries on your PostgreSQL database
   CREATE INDEX CONCURRENTLY idx_user_email ON "User"(email);
   CREATE INDEX CONCURRENTLY idx_work_report_date ON "DailyWorkReport"(date);
   CREATE INDEX CONCURRENTLY idx_billing_status ON "BillingRecord"(status);
   ```

2. **Nginx Optimization**
   ```nginx
   # Add to nginx.conf under server block
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
       gzip_static on;
   }
   ```

## 🔄 Updates and Maintenance

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose up -d --build

# Run database migrations if needed
docker-compose exec backend npx prisma migrate deploy
```

### Monitoring Updates

```bash
# Update monitoring stack
docker-compose -f docker-compose.monitoring.yml pull
docker-compose -f docker-compose.monitoring.yml up -d
```

### Backup Verification

```bash
# Run weekly backup verification
./scripts/verify-backups.sh
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs: `docker-compose logs`
3. Check health endpoints: `curl https://yourdomain.com/health`
4. Create an issue in the project repository

## 🔒 Security Checklist

- [ ] SSL certificates installed and valid
- [ ] Environment variables secured (no secrets in code)
- [ ] Database credentials rotated regularly
- [ ] Firewall configured (only necessary ports open)
- [ ] Regular security updates applied
- [ ] Automated backups configured and tested
- [ ] Monitoring and alerting set up
- [ ] Access logs monitored for suspicious activity

## 📊 Performance Monitoring

Monitor these key metrics:
- Response times (< 500ms for API calls)
- Error rates (< 1%)
- Database connection pool usage
- Memory and CPU usage
- SSL certificate expiration (30+ days remaining)
- Backup success/failure status

---

🎉 **Congratulations!** Your Employee Management System is now running in production with enterprise-grade reliability, security, and monitoring.
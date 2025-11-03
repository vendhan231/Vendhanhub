# 🚀 Production Deployment Guide

## ⚠️ Critical Networking Configuration

### Firewall Requirements
Ensure your server's firewall allows inbound TCP connections on:
- **Port 3000**: Frontend application access
- **Port 3002**: Backend API and Socket.IO real-time updates

### Environment Variables Setup

#### Frontend (.env)
```bash
# API Base URL - MUST point to your backend server
VITE_API_BASE_URL=http://localhost:3002/api/v1
# OR for production:
VITE_API_BASE_URL=http://YOUR_SERVER_IP:3002/api/v1
```

#### Backend (.env)
```bash
# Frontend URL for CORS configuration
FRONTEND_URL=http://localhost:3000
# OR for production:
FRONTEND_URL=http://YOUR_SERVER_IP:3000

# Server binding
HOST=0.0.0.0
PORT=3002
```

## 🛠️ Deployment Steps

### 1. Pre-deployment Checklist
- [ ] Update `VITE_API_BASE_URL` in frontend `.env` to point to backend
- [ ] Update `FRONTEND_URL` in backend `.env` for CORS
- [ ] Configure firewall to allow ports 3000 and 3001
- [ ] Ensure backend server binds to `0.0.0.0` (all interfaces)

### 2. Database Migration
```bash
# Generate Prisma client
npm run db:generate

# Deploy database schema
npm run db:deploy

# Seed initial data (optional)
npm run db:seed
```

### 3. Build and Start
```bash
# Build frontend
npm run build

# Start backend (in separate terminal)
cd employee-management-billing-backend
npm start

# Start frontend (in separate terminal)
npm run preview
```

## 🌐 Network Access

### Local Development
- Frontend: http://localhost:3000
- Backend API: http://localhost:3002
- Socket.IO: http://localhost:3002

### LAN Access (Other Devices)
- Frontend: http://YOUR_SERVER_IP:3000
- Backend API: http://YOUR_SERVER_IP:3002
- Socket.IO: http://YOUR_SERVER_IP:3002

### Production Domain
- Frontend: https://yourdomain.com
- Backend API: https://yourdomain.com/api/v1
- Socket.IO: https://yourdomain.com

## 🔧 Troubleshooting

### Common Issues

#### 1. Projects Not Showing on Dashboard
**Problem**: Admin-added projects don't appear on user dashboards
**Solution**:
- Verify `VITE_API_BASE_URL` points to correct backend
- Check browser network tab for failed API requests
- Ensure backend is running and accessible

#### 2. CORS Errors
**Problem**: Frontend can't connect to backend
**Solution**:
- Update `FRONTEND_URL` in backend `.env`
- Check that backend server is binding to `0.0.0.0`
- Verify firewall allows cross-origin requests

#### 3. Socket.IO Connection Issues
**Problem**: Real-time updates not working
**Solution**:
- Ensure Socket.IO client connects to correct server URL
- Check that backend Socket.IO server is running
- Verify firewall allows WebSocket connections

#### 4. Database Connection Issues
**Problem**: SQLite database not found or accessible
**Solution**:
- Check file permissions on `dev.db`/`prod.db`
- Ensure database files are in correct directory
- Verify `DATABASE_URL` path is correct

### Debug Commands

```bash
# Check if ports are listening
netstat -tulpn | grep :3000
netstat -tulpn | grep :3002

# Test backend health
curl http://localhost:3002/health

# Test API connectivity
curl http://localhost:3002/api/projects

# Check firewall status
sudo ufw status
# or
sudo iptables -L
```

## 🐳 Docker Deployment

### Build and Run
```bash
# Build images
docker build -t employee-management-frontend .
docker build -t employee-management-backend -f employee-management-billing-backend/Dockerfile .

# Run containers
docker run -d -p 3000:3000 --name frontend employee-management-frontend
docker run -d -p 3002:3002 --name backend employee-management-backend
```

### Docker Compose (Recommended)
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=http://backend:3001/api/v1
    depends_on:
      - backend

  backend:
    build: ./employee-management-billing-backend
    ports:
      - "3002:3002"
    environment:
      - FRONTEND_URL=http://localhost:3000
      - HOST=0.0.0.0
    volumes:
      - ./uploads:/app/uploads
```

## 🔒 Security Considerations

### Production Security Checklist
- [ ] Change default JWT secret
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular database backups
- [ ] File upload restrictions

### Environment Variables Security
- Never commit `.env` files to version control
- Use strong, unique secrets in production
- Rotate secrets regularly
- Limit environment variable exposure

## 📊 Monitoring

### Health Checks
- Backend health: `GET /health`
- Database connectivity: Automatic Prisma checks
- Socket.IO status: Connection logs

### Logs
- Application logs: Check server console output
- Database logs: Prisma query logs in development
- Error tracking: Configure Sentry or similar service

## 🚀 Quick Start Commands

```bash
# Development
npm run dev              # Start frontend dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Create new migration
npm run db:deploy       # Apply migrations
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio

# Production
./scripts/deploy.sh     # Linux/Mac deployment
scripts/deploy.bat      # Windows deployment
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Ensure firewall and network configuration is correct
4. Check server logs for detailed error messages
5. Test API endpoints manually with curl or Postman
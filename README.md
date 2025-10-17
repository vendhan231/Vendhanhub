# Employee Management & Billing System

A comprehensive full-stack application for managing employees, tracking work reports, handling billing, and managing leave requests with real-time updates.

## Features

### Core Functionality
- **User Management**: Admin and employee roles with secure authentication
- **Work Report Tracking**: Daily work reports with project logging and time tracking
- **Billing System**: Automated billing calculations with multiple pricing models
- **Leave Management**: Leave request system with approval workflow
- **Real-time Updates**: Socket.IO integration for live notifications
- **Dark Mode**: Complete theme switching support

### Technical Features
- **Profile Pictures**: Mandatory user avatars with upload functionality
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Error Boundaries**: Comprehensive error handling and recovery
- **Health Checks**: System monitoring endpoints
- **Security**: Helmet.js security headers, rate limiting, input validation
- **Performance**: Code splitting, compression, optimized builds

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Socket.IO Client** for real-time features
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma** ORM with SQLite/PostgreSQL
- **JWT** authentication
- **Socket.IO** for real-time communication
- **Multer** for file uploads
- **Helmet** for security headers
- **Compression** for performance

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (optional, for containerized deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employee-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd employee-management-billing-backend && npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the backend**
   ```bash
   cd employee-management-billing-backend
   npm run dev
   ```

5. **Start the frontend** (in a new terminal)
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Production Deployment

#### Using Docker Compose (Recommended)

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Application: http://localhost
   - Health checks: http://localhost/health

#### Manual Deployment

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Start the backend**
   ```bash
   cd employee-management-billing-backend
   npm run start
   ```

## Environment Variables

### Frontend (.env)
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

### Backend (.env)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
PORT=3001
```

## API Documentation

### Health Checks
- `GET /health` - Basic health check
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout

### User Management
- `GET /users/:userId` - Get user profile
- `PUT /users/:userId` - Update user profile
- `POST /users/:userId/profile-picture` - Upload profile picture

### Work Reports
- `POST /work-reports` - Submit daily work report
- `GET /work-reports` - Get user work reports

### Projects
- `GET /projects` - Get all projects
- `POST /projects` - Create new project
- `PUT /projects/:id` - Update project

### Billing
- `GET /billing-records` - Get billing records
- `POST /billing-calculator/calculate` - Calculate billing

## Database Schema

The application uses Prisma ORM with support for both SQLite (development) and PostgreSQL (production).

Key models:
- **User**: User accounts with roles and profile information
- **Project**: Project definitions with billing configurations
- **DailyWorkReport**: Daily work submissions
- **ProjectLogItem**: Individual work entries
- **LeaveRequest**: Leave management
- **BillingRecord**: Billing calculations and records

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Express rate limiting for API protection
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: Zod schemas for request validation
- **CORS**: Configured cross-origin resource sharing
- **File Upload Security**: Multer with file type and size validation

## Monitoring & Health

The application includes comprehensive health checks and monitoring:

- **Health Endpoints**: `/health`, `/ready`, `/live`
- **Error Boundaries**: React error boundaries for graceful error handling
- **Logging**: Structured logging with Winston (configurable)
- **Performance Monitoring**: Response time tracking
- **Database Health**: Connection status monitoring

## Development

### Available Scripts

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

#### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript
npm run start        # Start production server
npm run prisma:studio # Open Prisma Studio
```

### Code Quality

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Husky**: Git hooks for pre-commit checks

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation above

## Roadmap

- [ ] Advanced analytics dashboard
- [ ] Mobile application (React Native)
- [ ] Multi-tenant support
- [ ] Advanced reporting features
- [ ] Integration with external HR systems
- [ ] AI-powered work report analysis

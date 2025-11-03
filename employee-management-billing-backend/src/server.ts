import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './api/routes/auth.routes';
import userRoutes from './api/routes/user.routes';
import projectRoutes from './api/routes/project.routes';
import workReportRoutes from './api/routes/work-report.routes';
import leaveRequestRoutes from './api/routes/leave-request.routes';
import attendanceRoutes from './api/routes/attendance.routes';
import billingRecordRoutes from './api/routes/billing-record.routes';
import billingCalculatorRoutes from './api/routes/billing-calculator.routes';
import dashboardRoutes from './api/routes/dashboard.routes';
import messageRoutes from './api/routes/message.routes';
import aiRoutes from './api/routes/ai.routes';
import reportRoutes from './api/routes/report.routes';
import uploadRoutes from './api/routes/upload.routes';
import billingRoutes from './api/routes/billing.routes';
import healthRoutes from './api/routes/health.routes';
import userDetailRoutes from './api/routes/user-detail.routes';
import objectIdRoutes from './api/routes/object-id.routes';
import auditRoutes from './api/routes/audit.routes';
import errorMiddleware from './api/middleware/error.middleware';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';

dotenv.config();

// Database Configuration
const useServerDb = process.env.USE_SERVER_DB === 'true';
const serverDbUrl = process.env.SERVER_DB_URL;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn(`Socket.IO CORS blocked request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Initialize Prisma with conditional database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: useServerDb && serverDbUrl ? serverDbUrl : process.env.DATABASE_URL
    }
  }
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many attempts, please try again later.'
});

app.use('/', healthRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/work-reports', workReportRoutes);
app.use('/leave-requests', leaveRequestRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/billing-records', billingRecordRoutes);
app.use('/billing-calculator', billingCalculatorRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/messages', messageRoutes);
app.use('/ai', aiRoutes);
app.use('/reports', reportRoutes);
app.use('/upload', uploadRoutes);
app.use('/billing', billingRoutes);
app.use('/api/user-details', userDetailRoutes);
app.use('/api/object-ids', objectIdRoutes);
app.use('/api/audit', auditRoutes);

app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

// Socket.IO real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  socket.on('leave-room', (room) => {
    socket.leave(room);
    console.log(`Client ${socket.id} left room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available globally for routes
(global as any).io = io;

app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces (*) for LAN access

// Configure CORS for production and LAN access
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://192.168.29.106:3000',
  'http://192.168.29.106:5173',
  process.env.NODE_ENV === 'production' ? `http://${process.env.HOST || 'localhost'}:3000` : null,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`LAN access available at: http://192.168.29.106:${PORT}`);
  console.log(`Server bound to all interfaces (*) - accessible from any IP on the network`);
  console.log(`Real-time updates enabled via Socket.IO`);
  console.log(`Database: ${useServerDb ? 'Server Database' : 'Local SQLite'}`);
  if (useServerDb) {
    console.log(`Server DB URL configured: ${serverDbUrl ? 'Yes' : 'No'}`);
  }
  console.log(`To access from other devices, use: http://[SERVER_IP]:${PORT}`);
});
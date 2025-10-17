import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
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
import errorMiddleware from './api/middleware/error.middleware';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many attempts, please try again later.'
});

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

app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
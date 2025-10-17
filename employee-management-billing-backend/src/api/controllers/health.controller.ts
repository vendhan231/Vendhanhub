import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        type: 'SQLite'
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
};

export const readinessCheck = async (req: Request, res: Response) => {
  try {
    // More thorough checks for readiness
    await prisma.$queryRaw`SELECT 1`;

    // Check if required environment variables are set
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      return res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: `Missing required environment variables: ${missingVars.join(', ')}`
      });
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        environment: 'configured'
      }
    });
  } catch (error) {
    console.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Service not ready'
    });
  }
};
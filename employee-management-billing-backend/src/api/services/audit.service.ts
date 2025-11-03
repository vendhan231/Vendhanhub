import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

export class AuditService {
  static async logActivity(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
          newValues: data.newValues ? JSON.stringify(data.newValues) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          details: data.details,
        },
      });
    } catch (error) {
      console.error('Failed to log audit activity:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  static async getAuditLogs(filters?: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    logs: any[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const where: any = {};

      if (filters?.userId) where.userId = filters.userId;
      if (filters?.entityType) where.entityType = filters.entityType;
      if (filters?.entityId) where.entityId = filters.entityId;
      if (filters?.action) where.action = filters.action;

      if (filters?.startDate || filters?.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
          take: filters?.limit || 50,
          skip: filters?.offset || 0,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        logs: logs.map((log: any) => ({
          ...log,
          oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
          newValues: log.newValues ? JSON.parse(log.newValues) : null,
        })),
        total,
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
      };
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }

  static async getAuditStats(): Promise<{
    totalLogs: number;
    userActivity: any[];
    entityActivity: any[];
    actionActivity: any[];
    recentActivity: any[];
  }> {
    try {
      const [
        totalLogs,
        userActivity,
        entityActivity,
        actionActivity,
        recentActivity,
      ] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.groupBy({
          by: ['userId'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        prisma.auditLog.groupBy({
          by: ['entityType'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
        prisma.auditLog.groupBy({
          by: ['action'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
        prisma.auditLog.findMany({
          take: 20,
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
      ]);

      return {
        totalLogs,
        userActivity: await Promise.all(
          userActivity.map(async (activity: any) => {
            const user = await prisma.user.findUnique({
              where: { id: activity.userId! },
              select: { username: true, firstName: true, lastName: true },
            });
            return {
              userId: activity.userId,
              userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
              username: user?.username || 'Unknown',
              count: activity._count.id,
            };
          })
        ),
        entityActivity,
        actionActivity,
        recentActivity: recentActivity.map((activity: any) => ({
          ...activity,
          oldValues: activity.oldValues ? JSON.parse(activity.oldValues) : null,
          newValues: activity.newValues ? JSON.parse(activity.newValues) : null,
        })),
      };
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
      throw error;
    }
  }
}

export const auditService = new AuditService();
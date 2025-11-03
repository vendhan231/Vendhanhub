import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only admins can access audit logs
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      limit = '50',
      offset = '0',
    } = req.query;

    const filters = {
      userId: userId as string,
      entityType: entityType as string,
      entityId: entityId as string,
      action: action as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const result = await AuditService.getAuditLogs(filters);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only admins can access audit stats
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await AuditService.getAuditStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
};
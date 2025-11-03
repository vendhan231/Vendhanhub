import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';

export const auditMiddleware = (action: string, entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const originalSend = res.send;

    // Store original data for comparison
    let oldValues: any = null;
    let entityId: string | undefined;

    // For update operations, try to get existing data
    if (req.method === 'PUT' || req.method === 'PATCH') {
      try {
        // This would need to be customized based on the specific route
        // For now, we'll capture the entity ID from params
        entityId = req.params.id || req.params.userId || req.params.projectId || req.params.reportId;
      } catch (error) {
        console.error('Error capturing old values for audit:', error);
      }
    }

    // Override res.send to capture the response
    res.send = function(data) {
      // Log the activity after successful response
      if (res.statusCode >= 200 && res.statusCode < 300 && user) {
        const auditData = {
          userId: user.id,
          action,
          entityType,
          entityId,
          oldValues,
          newValues: req.method !== 'GET' ? req.body : undefined,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          details: `HTTP ${req.method} ${req.originalUrl}`,
        };

        // Log asynchronously to avoid blocking the response
        AuditService.logActivity(auditData).catch(error => {
          console.error('Failed to log audit activity:', error);
        });
      }

      // Call original send method
      return originalSend.call(this, data);
    };

    next();
  };
};

// Specific audit middleware for common operations
export const auditUserActivity = auditMiddleware('USER_ACTIVITY', 'USER');
export const auditProjectActivity = auditMiddleware('PROJECT_ACTIVITY', 'PROJECT');
export const auditReportActivity = auditMiddleware('REPORT_ACTIVITY', 'REPORT');
export const auditBillingActivity = auditMiddleware('BILLING_ACTIVITY', 'BILLING_RECORD');
export const auditAuthActivity = auditMiddleware('AUTH_ACTIVITY', 'AUTH');
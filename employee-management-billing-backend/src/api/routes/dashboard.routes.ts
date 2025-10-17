import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { dashboardController } from '../controllers/dashboard.controller';

const router = Router();

// Dashboard data aggregation routes
router.get('/admin', authenticateJWT, dashboardController.getAdminDashboardData);
router.get('/employee/:userId', authenticateJWT, dashboardController.getEmployeeDashboardData);

export default router;
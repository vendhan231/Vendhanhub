import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// All report routes require authentication
router.use(authenticateJWT);

router.post('/', reportController.createReport);
router.get('/', reportController.getReports);
router.get('/:reportId', reportController.getReportById);
router.post('/check-duplicate', reportController.checkDuplicateObjectIds);

export default router;
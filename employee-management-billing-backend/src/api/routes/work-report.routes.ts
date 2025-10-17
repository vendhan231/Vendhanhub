import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateWorkReport } from '../validators/work-report.validators';
import * as workReportController from '../controllers/work-report.controller';

const router = Router();

// POST /work-reports - Create a new daily work report
router.post('/', authenticateJWT, validateWorkReport, workReportController.createWorkReport);

// PUT /work-reports - Update an existing daily work report
router.put('/:reportId', authenticateJWT, validateWorkReport, workReportController.updateWorkReport);

export default router;
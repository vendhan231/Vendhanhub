import { Router } from 'express';
import * as billingController from '../controllers/billing.controller';
import { authenticateJWT, authorizeAdmin } from '../middleware/auth.middleware';
import { auditBillingActivity } from '../middleware/audit.middleware';

const router = Router();

// All billing routes require authentication
router.use(authenticateJWT);

router.get('/', billingController.getBillingRecords);
router.put('/:billingId/status', auditBillingActivity, billingController.updateBillingStatus);
router.delete('/:billingId', auditBillingActivity, billingController.deleteBillingRecord);

// Admin-only routes
router.get('/analytics/summary', authorizeAdmin, billingController.getBillingAnalytics);
router.get('/analytics/by-project', authorizeAdmin, billingController.getBillingByProject);
router.get('/analytics/by-user', authorizeAdmin, billingController.getBillingByUser);

export default router;
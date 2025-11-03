import { Router } from 'express';
import { authenticateJWT, authorizeAdmin } from '../middleware/auth.middleware';
import { getAuditLogs, getAuditStats } from '../controllers/audit.controller';

const router = Router();

// All audit routes require authentication and admin access
router.use(authenticateJWT);
router.use(authorizeAdmin);

router.get('/logs', getAuditLogs);
router.get('/stats', getAuditStats);

export default router;
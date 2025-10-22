import { Router } from 'express';
import {
  getObjectIdRegistry,
  getObjectIdHistory,
  checkObjectIdExists,
  getObjectIdStats,
  bulkDeleteObjectIds
} from '../controllers/object-id.controller';
import { authenticateJWT, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Get Object ID registry
router.get('/', getObjectIdRegistry);

// Get Object ID usage history
router.get('/:objectId/history', getObjectIdHistory);

// Check if Object ID exists (for validation)
router.get('/check/:objectId', checkObjectIdExists);

// Get Object ID statistics
router.get('/stats/overview', getObjectIdStats);

// Bulk delete Object ID entries (admin only)
router.delete('/bulk', authorizeAdmin, bulkDeleteObjectIds);

export default router;
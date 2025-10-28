import { Router } from 'express';
import multer from 'multer';
import {
  getObjectIdRegistry,
  getObjectIdHistory,
  checkObjectIdExists,
  getObjectIdStats,
  bulkUploadObjectIds,
  bulkDeleteObjectIds
} from '../controllers/object-id.controller';
import { authenticateJWT, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

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

// Bulk upload Object ID entries (admin only)
router.post('/upload', authorizeAdmin, upload.single('file'), bulkUploadObjectIds);

// Bulk delete Object ID entries (admin only)
router.delete('/bulk', authorizeAdmin, bulkDeleteObjectIds);

export default router;
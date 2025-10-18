import { Router } from 'express';
import multer from 'multer';
import {
  submitWorkReport,
  processFiles,
  calculateBilling,
  getWorkReports,
  downloadWorkReport
} from '../controllers/work-report.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV, Excel, and JSON files
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype.includes('spreadsheet') ||
      file.mimetype === 'application/json' ||
      file.originalname.endsWith('.csv') ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls') ||
      file.originalname.endsWith('.json')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, Excel, and JSON files are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authenticateJWT);

// Submit work report
router.post('/submit', submitWorkReport);

// Process uploaded files
router.post('/process-files', upload.array('files', 10), processFiles);

// Calculate billing
router.post('/calculate-billing', calculateBilling);

// Get work reports
router.get('/', getWorkReports);

// Download work report
router.get('/:reportId/download', downloadWorkReport);

export default router;
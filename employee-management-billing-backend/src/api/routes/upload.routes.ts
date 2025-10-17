import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// All upload routes require authentication
router.use(authenticateJWT);

router.post('/extract', uploadController.uploadMiddleware, uploadController.extractFields);

export default router;
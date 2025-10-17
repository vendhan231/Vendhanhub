import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { generate } from '../controllers/ai.controller';
import { zodValidation } from '../middleware/validation.middleware';
import { aiRequestSchema } from '../validators/ai.validators';

const router = Router();

router.post('/generate-content', authenticateJWT, zodValidation(aiRequestSchema), generate);

export default router;
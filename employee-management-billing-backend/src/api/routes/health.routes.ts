import { Router } from 'express';
import { healthCheck, readinessCheck } from '../controllers/health.controller';

const router = Router();

// Health check endpoints
router.get('/health', healthCheck);
router.get('/ready', readinessCheck);
router.get('/live', healthCheck); // Kubernetes liveness probe

export default router;
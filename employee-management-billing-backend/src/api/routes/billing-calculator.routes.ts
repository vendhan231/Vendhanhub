import { Router } from 'express';
import { authenticateJWT, authorizeAdmin } from '../middleware/auth.middleware';
import { calculateBilling, finalizeBilling } from '../controllers/billing-calculator.controller';
import { calculateBillingValidator, finalizeBillingValidator } from '../validators/billing-calculator.validators';

const router = Router();

// Route to calculate billing for a period
router.post('/calculate', authenticateJWT, authorizeAdmin, calculateBillingValidator, calculateBilling);

// Route to finalize billing for a period
router.post('/finalize', authenticateJWT, authorizeAdmin, finalizeBillingValidator, finalizeBilling);

export default router;
import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
import { validateLogin, validateRegister } from '../validators/auth.validators';
import { authenticateJWT } from '../middleware/auth.middleware';
import { auditAuthActivity } from '../middleware/audit.middleware';

const router = Router();

router.post('/login', validateLogin, auditAuthActivity, login);
router.post('/register', authenticateJWT, validateRegister, auditAuthActivity, register);

export default router;
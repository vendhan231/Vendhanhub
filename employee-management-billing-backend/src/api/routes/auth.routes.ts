import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
import { validateLogin, validateRegister } from '../validators/auth.validators';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', validateLogin, login);
router.post('/register', authenticateJWT, validateRegister, register);

export default router;
import { Router } from 'express';
import { authenticateJWT, authorizeAdmin, authorizeOwnerOrAdmin } from '../middleware/auth.middleware';
import { createUser, getUser, updateUser, deleteUser, changePassword } from '../controllers/user.controller';
import { createUserValidator, updateUserValidator, changePasswordValidator } from '../validators/user.validators';

const router = Router();

// User management routes
router.post('/', authenticateJWT, authorizeAdmin, createUserValidator, createUser);
router.get('/:userId', authenticateJWT, authorizeOwnerOrAdmin, getUser);
router.put('/:userId', authenticateJWT, authorizeOwnerOrAdmin, updateUserValidator, updateUser);
router.delete('/:userId', authenticateJWT, authorizeAdmin, deleteUser);
router.post('/change-password', authenticateJWT, changePasswordValidator, changePassword);

export default router;
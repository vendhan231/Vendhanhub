import { Router } from 'express';
import { authenticateJWT, authorizeAdmin, authorizeOwnerOrAdmin } from '../middleware/auth.middleware';
import { createUser, getUserById, updateUser, deleteUser, uploadProfilePicture } from '../controllers/user.controller';
import { createUserSchema, updateUserSchema } from '../validators/user.validators';
import { auditUserActivity } from '../middleware/audit.middleware';

const router = Router();

// User management routes
router.post('/', authenticateJWT, authorizeAdmin, auditUserActivity, createUser);
router.get('/:userId', authenticateJWT, authorizeOwnerOrAdmin, getUserById);
router.put('/:userId', authenticateJWT, authorizeOwnerOrAdmin, auditUserActivity, updateUser);
router.delete('/:userId', authenticateJWT, authorizeAdmin, auditUserActivity, deleteUser);
router.post('/:userId/profile-picture', authenticateJWT, authorizeOwnerOrAdmin, auditUserActivity, uploadProfilePicture);

export default router;
import { Router } from 'express';
import { authenticateJWT, authorizeAdmin, authorizeOwnerOrAdmin } from '../middleware/auth.middleware';
import { createUser, getUserById, updateUser, deleteUser, uploadProfilePicture } from '../controllers/user.controller';
import { createUserSchema, updateUserSchema } from '../validators/user.validators';

const router = Router();

// User management routes
router.post('/', authenticateJWT, authorizeAdmin, createUser);
router.get('/:userId', authenticateJWT, authorizeOwnerOrAdmin, getUserById);
router.put('/:userId', authenticateJWT, authorizeOwnerOrAdmin, updateUser);
router.delete('/:userId', authenticateJWT, authorizeAdmin, deleteUser);
router.post('/:userId/profile-picture', authenticateJWT, authorizeOwnerOrAdmin, uploadProfilePicture);

export default router;
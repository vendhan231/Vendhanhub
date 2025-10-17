import { Router } from 'express';
import { authenticateJWT, authorizeAdmin } from '../middleware/auth.middleware';
import { createProject, getProjects, getProjectById, updateProject, deleteProject } from '../controllers/project.controller';
import { createProjectValidator, updateProjectValidator } from '../validators/project.validators';

const router = Router();

// Admin only routes
router.post('/', authenticateJWT, authorizeAdmin, createProjectValidator, createProject);
router.get('/', authenticateJWT, getProjects);
router.get('/:projectId', authenticateJWT, getProjectById);
router.put('/:projectId', authenticateJWT, authorizeAdmin, updateProjectValidator, updateProject);
router.delete('/:projectId', authenticateJWT, authorizeAdmin, deleteProject);

export default router;
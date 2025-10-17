import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateLeaveRequest, validateCancelLeaveRequest } from '../validators/leave-request.validators';
import * as leaveRequestController from '../controllers/leave-request.controller';

const router = Router();

// Create a new leave request
router.post('/', authenticateJWT, validateLeaveRequest, leaveRequestController.createLeaveRequest);

// Cancel a leave request
router.put('/:requestId/cancel', authenticateJWT, validateCancelLeaveRequest, leaveRequestController.cancelLeaveRequest);

export default router;
import { Router } from 'express';
import {
  getUserDetails,
  updateUserProfile,
  getUserAttendance,
  getUserLeaveRequests,
  getUserWorkReports,
  updateWorkReport,
  updateLeaveRequestStatus
} from '../controllers/user-detail.controller';
import { authenticateJWT, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and admin authorization
router.use(authenticateJWT);
router.use(authorizeAdmin);

// Get comprehensive user details
router.get('/:userId', getUserDetails);

// Update user profile (admin only)
router.put('/:userId/profile', updateUserProfile);

// Get user attendance records
router.get('/:userId/attendance', getUserAttendance);

// Get user leave requests
router.get('/:userId/leave-requests', getUserLeaveRequests);

// Get user work reports
router.get('/:userId/work-reports', getUserWorkReports);

// Update work report (admin edit)
router.put('/work-reports/:reportId', updateWorkReport);

// Update leave request status (admin approval/rejection)
router.put('/leave-requests/:leaveId/status', updateLeaveRequestStatus);

export default router;
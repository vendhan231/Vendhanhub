import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateAttendance } from '../validators/attendance.validators';
import { AttendanceController } from '../controllers/attendance.controller';

const router = Router();

// Clock In
router.post('/clock-in', authenticateJWT, validateAttendance, AttendanceController.clockIn);

// Clock Out
router.post('/clock-out', authenticateJWT, AttendanceController.clockOut);

// Get Attendance Status
router.get('/status/me', authenticateJWT, AttendanceController.getStatus);

export default router;
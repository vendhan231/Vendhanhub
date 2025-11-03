import { Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import { validateAttendanceClockIn, validateAttendanceClockOut, validateAttendance } from '../validators/attendance.validators';

export const clockIn = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        validateAttendanceClockIn(req.body);
        const attendanceRecord = await attendanceService.clockIn(user.id);
        res.status(201).json(attendanceRecord);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

export const clockOut = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        validateAttendanceClockOut(req.body);
        const attendanceRecord = await attendanceService.clockOut(user.id);
        res.status(200).json(attendanceRecord);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

export const getStatus = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        validateAttendance(req.body);
        const status = await attendanceService.getStatus(user.id);
        res.status(200).json(status);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

export const AttendanceController = {
    clockIn,
    clockOut,
    getStatus,
};
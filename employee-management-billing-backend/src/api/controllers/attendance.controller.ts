import { Request, Response } from 'express';
import { z } from 'zod';
import { AttendanceService } from '../services/attendance.service';
import { validateAttendanceClockIn, validateAttendanceClockOut } from '../validators/attendance.validators';

const attendanceService = new AttendanceService();

export const clockIn = async (req: Request, res: Response) => {
    try {
        validateAttendanceClockIn(req.body);
        const userId = req.user.id;
        const attendanceRecord = await attendanceService.clockIn(userId);
        res.status(201).json(attendanceRecord);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const clockOut = async (req: Request, res: Response) => {
    try {
        validateAttendanceClockOut(req.body);
        const userId = req.user.id;
        const attendanceRecord = await attendanceService.clockOut(userId);
        res.status(200).json(attendanceRecord);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getStatus = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const status = await attendanceService.getStatus(userId);
        res.status(200).json(status);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
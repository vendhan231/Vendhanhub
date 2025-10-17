import { Request, Response } from 'express';
import { LeaveRequest } from '@prisma/client';
import { leaveRequestService } from '../services/leave-request.service';
import { z } from 'zod';
import { validationMiddleware } from '../middleware/validation.middleware';

const leaveRequestSchema = z.object({
  leaveType: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'OTHER']),
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().min(1),
});

export const createLeaveRequest = async (req: Request, res: Response) => {
  try {
    const validatedData = leaveRequestSchema.parse(req.body);
    const userId = req.user.id; // Assuming user ID is attached to req.user by auth middleware
    const leaveRequest: LeaveRequest = await leaveRequestService.createLeaveRequest({
      ...validatedData,
      userId,
      userFirstName: req.user.firstName,
      userLastName: req.user.lastName,
      requestedAt: new Date(),
    });
    res.status(201).json(leaveRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const cancelLeaveRequest = async (req: Request, res: Response) => {
  const { requestId } = req.params;
  try {
    const leaveRequest = await leaveRequestService.cancelLeaveRequest(requestId, req.user.id);
    res.status(200).json(leaveRequest);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
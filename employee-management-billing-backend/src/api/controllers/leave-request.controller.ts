import { Request, Response } from 'express';
import { LeaveRequest } from '@prisma/client';
import { leaveRequestService } from '../services/leave-request.service';
import { validateLeaveRequest, validateCancelLeaveRequest } from '../validators/leave-request.validators';

export const createLeaveRequest = async (req: Request, res: Response) => {
  try {
    const validatedData = validateLeaveRequest(req.body);
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const leaveRequest = await leaveRequestService.createLeaveRequest({
      ...validatedData,
      userId: user.id,
      userFirstName: user.firstName || user.username,
      userLastName: user.lastName || '',
      requestedAt: new Date(),
    } as any);
    res.status(201).json(leaveRequest);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const cancelLeaveRequest = async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const leaveRequest = await leaveRequestService.cancelLeaveRequest(requestId, user.id);
    res.status(200).json(leaveRequest);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};
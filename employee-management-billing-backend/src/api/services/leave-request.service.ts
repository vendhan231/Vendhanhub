import { PrismaClient } from '@prisma/client';
import { LeaveRequest } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schema for leave request validation
const leaveRequestSchema = z.object({
  userId: z.string(),
  leaveType: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'OTHER']),
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().min(1),
});

// Service to handle leave request operations
class LeaveRequestService {
  async createLeaveRequest(data: LeaveRequest) {
    const validatedData = leaveRequestSchema.parse(data);
    return await prisma.leaveRequest.create({
      data: {
        userId: validatedData.userId,
        leaveType: validatedData.leaveType,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        reason: validatedData.reason,
        status: 'PENDING',
        requestedAt: new Date(),
      },
    });
  }

  async cancelLeaveRequest(requestId: string, userId: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!leaveRequest || leaveRequest.userId !== userId || leaveRequest.status !== 'PENDING') {
      throw new Error('Leave request cannot be canceled.');
    }

    return await prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });
  }

  async getLeaveRequestsByUser(userId: string) {
    return await prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    });
  }
}

export const leaveRequestService = new LeaveRequestService();
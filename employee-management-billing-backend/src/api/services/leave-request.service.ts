import { LeaveRequest } from '@prisma/client';
import config from '../../config';

const prisma = config.prisma;

// Service to handle leave request operations
class LeaveRequestService {
  async createLeaveRequest(data: any) {
    return await prisma.leaveRequest.create({
      data: {
        userId: data.userId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        status: 'PENDING',
        requestedAt: data.requestedAt || new Date(),
        userFirstName: data.userFirstName,
        userLastName: data.userLastName,
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
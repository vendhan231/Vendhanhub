import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get comprehensive user details including attendance, leave, and reports
export const getUserDetails = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    // Get user basic information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        phone: true,
        joinDate: true,
        profilePictureUrl: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get attendance records for the current month
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Get leave requests
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { userId: userId },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    // Get work reports for the current month
    const workReports = await prisma.dailyWorkReport.findMany({
      where: {
        userId: userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        }
      },
      include: {
        projectLogItems: {
          include: {
            project: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Format the response data
    const formattedAttendance = attendanceRecords.map(record => ({
      id: record.id,
      date: record.date.toISOString().split('T')[0],
      clockInTime: record.clockInTime?.toISOString(),
      clockOutTime: record.clockOutTime?.toISOString(),
      totalHours: record.totalHours,
      status: record.clockInTime ? 'PRESENT' : 'ABSENT'
    }));

    const formattedLeaveRequests = leaveRequests.map(request => ({
      id: request.id,
      leaveType: request.leaveType,
      startDate: request.startDate.toISOString().split('T')[0],
      endDate: request.endDate.toISOString().split('T')[0],
      reason: request.reason,
      status: request.status,
      requestedAt: request.requestedAt.toISOString(),
      adminNotes: request.adminNotes,
      resolvedAt: request.resolvedAt?.toISOString()
    }));

    const formattedWorkReports = workReports.map(report => ({
      id: report.id,
      date: report.date.toISOString().split('T')[0],
      submittedAt: report.submittedAt.toISOString(),
      status: 'SUBMITTED', // You can add status field to the model if needed
      projectLogs: report.projectLogItems.map(log => ({
        projectName: log.projectName,
        hoursWorked: log.hoursWorked.toNumber(),
        description: log.description,
        achievedCount: log.achievedCount
      }))
    }));

    const response = {
      user: {
        ...user,
        joinDate: user.joinDate?.toISOString().split('T')[0],
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      attendance: formattedAttendance,
      leaveRequests: formattedLeaveRequests,
      workReports: formattedWorkReports,
      summary: {
        totalAttendanceDays: formattedAttendance.filter(a => a.clockInTime).length,
        pendingLeaveRequests: formattedLeaveRequests.filter(l => l.status === 'PENDING').length,
        totalWorkReports: formattedWorkReports.length,
        totalHoursWorked: formattedWorkReports.reduce((total, report) =>
          total + report.projectLogs.reduce((subtotal, log) => subtotal + Number(log.hoursWorked), 0), 0
        )
      }
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
};

// Update user profile (admin only)
export const updateUserProfile = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        phone: true,
        joinDate: true,
        profilePictureUrl: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.status(200).json({
      ...updatedUser,
      joinDate: updatedUser.joinDate?.toISOString().split('T')[0],
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Failed to update user profile' });
  }
};

// Get user attendance records with filtering
export const getUserAttendance = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        }
      };
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: userId,
        ...dateFilter,
      },
      orderBy: {
        date: 'desc'
      },
      take: parseInt(limit),
    });

    const formattedRecords = attendanceRecords.map(record => ({
      id: record.id,
      date: record.date.toISOString().split('T')[0],
      clockInTime: record.clockInTime?.toISOString(),
      clockOutTime: record.clockOutTime?.toISOString(),
      totalHours: record.totalHours,
      notes: record.notes,
      status: record.clockInTime ? 'PRESENT' : 'ABSENT'
    }));

    res.status(200).json(formattedRecords);
  } catch (error: any) {
    console.error('Error fetching user attendance:', error);
    res.status(500).json({ message: 'Failed to fetch attendance records' });
  }
};

// Get user leave requests with filtering
export const getUserLeaveRequests = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { status, startDate, endDate } = req.query;

    let filters: any = { userId: userId };

    if (status) {
      filters.status = status;
    }

    if (startDate || endDate) {
      filters.startDate = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: filters,
      orderBy: {
        requestedAt: 'desc'
      }
    });

    const formattedRequests = leaveRequests.map(request => ({
      id: request.id,
      leaveType: request.leaveType,
      startDate: request.startDate.toISOString().split('T')[0],
      endDate: request.endDate.toISOString().split('T')[0],
      reason: request.reason,
      status: request.status,
      requestedAt: request.requestedAt.toISOString(),
      adminNotes: request.adminNotes,
      resolvedAt: request.resolvedAt?.toISOString(),
      userFirstName: request.userFirstName,
      userLastName: request.userLastName,
    }));

    res.status(200).json(formattedRequests);
  } catch (error: any) {
    console.error('Error fetching user leave requests:', error);
    res.status(500).json({ message: 'Failed to fetch leave requests' });
  }
};

// Get user work reports with filtering
export const getUserWorkReports = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, projectId, limit = 50 } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        }
      };
    }

    const workReports = await prisma.dailyWorkReport.findMany({
      where: {
        userId: userId,
        ...dateFilter,
        ...(projectId && {
          projectLogItems: {
            some: {
              projectId: projectId
            }
          }
        })
      },
      include: {
        projectLogItems: {
          include: {
            project: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: parseInt(limit),
    });

    const formattedReports = workReports.map(report => ({
      id: report.id,
      date: report.date.toISOString().split('T')[0],
      submittedAt: report.submittedAt.toISOString(),
      status: 'SUBMITTED', // You can add status field if needed
      projectLogs: report.projectLogItems.map(log => ({
        id: log.id,
        projectId: log.projectId,
        projectName: log.project.name,
        hoursWorked: log.hoursWorked.toNumber(),
        description: log.description,
        achievedCount: log.achievedCount
      }))
    }));

    res.status(200).json(formattedReports);
  } catch (error: any) {
    console.error('Error fetching user work reports:', error);
    res.status(500).json({ message: 'Failed to fetch work reports' });
  }
};

// Update work report (admin edit)
export const updateWorkReport = async (req: any, res: any) => {
  try {
    const { reportId } = req.params;
    const updateData = req.body;

    // First, delete existing project log items
    await prisma.projectLogItem.deleteMany({
      where: { dailyWorkReportId: reportId }
    });

    // Update the report
    const updatedReport = await prisma.dailyWorkReport.update({
      where: { id: reportId },
      data: {
        ...updateData,
        // Add new project log items if provided
        ...(updateData.projectLogs && {
          projectLogItems: {
            create: updateData.projectLogs.map((log: any) => ({
              projectId: log.projectId,
              projectName: log.projectName,
              hoursWorked: log.hoursWorked,
              description: log.description,
              achievedCount: log.achievedCount
            }))
          }
        })
      },
      include: {
        projectLogItems: {
          include: {
            project: true
          }
        }
      }
    });

    res.status(200).json({
      id: updatedReport.id,
      date: updatedReport.date.toISOString().split('T')[0],
      submittedAt: updatedReport.submittedAt.toISOString(),
      status: 'SUBMITTED',
      projectLogs: updatedReport.projectLogItems.map(log => ({
        id: log.id,
        projectId: log.projectId,
        projectName: log.project.name,
        hoursWorked: log.hoursWorked.toNumber(),
        description: log.description,
        achievedCount: log.achievedCount
      }))
    });
  } catch (error: any) {
    console.error('Error updating work report:', error);
    res.status(500).json({ message: 'Failed to update work report' });
  }
};

// Update leave request status (admin approval/rejection)
export const updateLeaveRequestStatus = async (req: any, res: any) => {
  try {
    const { leaveId } = req.params;
    const { status, adminNotes } = req.body;

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: status,
        adminNotes: adminNotes,
        resolvedAt: new Date()
      }
    });

    res.status(200).json({
      id: updatedRequest.id,
      leaveType: updatedRequest.leaveType,
      startDate: updatedRequest.startDate.toISOString().split('T')[0],
      endDate: updatedRequest.endDate.toISOString().split('T')[0],
      reason: updatedRequest.reason,
      status: updatedRequest.status,
      requestedAt: updatedRequest.requestedAt.toISOString(),
      adminNotes: updatedRequest.adminNotes,
      resolvedAt: updatedRequest.resolvedAt?.toISOString(),
      userFirstName: updatedRequest.userFirstName,
      userLastName: updatedRequest.userLastName,
    });
  } catch (error: any) {
    console.error('Error updating leave request status:', error);
    res.status(500).json({ message: 'Failed to update leave request status' });
  }
};
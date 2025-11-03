import config from '../../config';

const prisma = config.prisma;

export const calculateBillingPeriod = async (startDate: Date, endDate: Date) => {
  const users = await prisma.user.findMany();
  const countBasedProjects = await prisma.project.findMany();

  const summaries: any[] = [];

  for (const user of users) {
    const dailyWorkReports = await prisma.dailyWorkReport.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
        // Include related ProjectLogItems if needed
      },
      include: {
        projectLogItems: true,
      },
    });

    const approvedLeaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId: user.id,
        status: 'APPROVED',
        startDate: {
          lte: endDate,
        },
        endDate: {
          gte: startDate,
        },
      },
    });

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Perform calculations based on the fetched data
    const summary = {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      // Add more fields as necessary
    };

    summaries.push(summary);
  }

  return summaries;
};

export const finalizeBilling = async (summaryData: any[]) => {
  // TODO: Implement finalize billing logic
  console.log('Finalizing billing for users:', summaryData.map(s => s.userId));
};
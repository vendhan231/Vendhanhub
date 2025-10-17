import { PrismaClient } from '@prisma/client';
import { EmployeePeriodBillingSummary } from '../models/EmployeePeriodBillingSummary'; // Assuming this model exists
import { DailyWorkReport, LeaveRequest, AttendanceRecord } from '../models'; // Adjust imports as necessary

const prisma = new PrismaClient();

export const calculateBillingPeriod = async (startDate: Date, endDate: Date) => {
  const users = await prisma.user.findMany();
  const countBasedProjects = await prisma.project.findMany({
    where: { billingType: 'count_based' },
  });

  const summaries: EmployeePeriodBillingSummary[] = [];

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

export const finalizeBilling = async (summaryData: EmployeePeriodBillingSummary[]) => {
  await prisma.$transaction(async (prisma) => {
    for (const summary of summaryData) {
      const billingRecord = await prisma.billingRecord.create({
        data: {
          userId: summary.userId,
          // Add other necessary fields
        },
      });

      // If using separate table for details
      await prisma.billingRecordDetail.createMany({
        data: summary.details.map(detail => ({
          billingRecordId: billingRecord.id,
          // Map other fields from detail
        })),
      });

      // Create an internal message for the user
      await prisma.internalMessage.create({
        data: {
          recipientId: summary.userId,
          content: `Your billing for the period has been finalized.`,
          // Add other necessary fields
        },
      });
    }
  });
};
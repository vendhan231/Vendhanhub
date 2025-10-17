import { prisma } from '../../config'; // Import Prisma client instance
import { User } from '@prisma/client'; // Import User model type

export const getDashboardData = async () => {
  const totalUsers = await prisma.user.count();
  const totalAttendanceRecords = await prisma.attendanceRecord.count();
  const totalBillingRecords = await prisma.billingRecord.count();
  
  const today = new Date();
  const totalClockInsToday = await prisma.attendanceRecord.count({
    where: {
      date: today,
      clockInTime: {
        not: null,
      },
    },
  });

  return {
    totalUsers,
    totalAttendanceRecords,
    totalBillingRecords,
    totalClockInsToday,
  };
};
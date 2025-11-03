import config from '../../config';
import { getAllProjects } from './project.service';

const prisma = config.prisma;

export const getDashboardData = async () => {
  const totalUsers = await prisma.user.count();
  const totalAttendanceRecords = await prisma.attendanceRecord.count();
  const totalBillingRecords = await prisma.billingRecord.count();
  const projects = await getAllProjects();

  const today = new Date();
  const totalClockInsToday = await prisma.attendanceRecord.count({
    where: {
      date: today,
    },
  });

  // Calculate total earnings from all billing records
  const totalEarningsResult = await prisma.billingRecord.aggregate({
    _sum: {
      calculatedAmount: true,
    },
  });
  const totalEarnings = Number(totalEarningsResult._sum?.calculatedAmount) || 0;

  // Get employee count (users with role 'employee')
  const totalEmployees = await prisma.user.count({
    where: {
      role: 'employee',
    },
  });

  // Get active users (users who have logged in recently or have recent activity)
  // For now, count all users as active
  const activeUsers = totalUsers;

  // Get present today count
  const presentToday = totalClockInsToday;

  // Get absent today (employees who haven't clocked in today)
  const absentToday = totalEmployees - presentToday;

  return {
    totalEmployees,
    activeUsers,
    presentToday,
    absentToday,
    totalEarnings,
    projects,
  };
};

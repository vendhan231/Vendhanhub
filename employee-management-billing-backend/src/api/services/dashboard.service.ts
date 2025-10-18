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

  return {
    totalUsers,
    totalAttendanceRecords,
    totalBillingRecords,
    totalClockInsToday,
    projects,
  };
};

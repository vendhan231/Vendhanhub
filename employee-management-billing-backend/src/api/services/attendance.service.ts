import { PrismaClient } from '@prisma/client';
import { AttendanceRecord } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const attendanceSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  clockInTime: z.string().refine((time) => !isNaN(Date.parse(time)), {
    message: "Invalid clock-in time format",
  }),
  clockOutTime: z.string().optional().refine((time) => !isNaN(Date.parse(time)), {
    message: "Invalid clock-out time format",
  }),
  notes: z.string().optional(),
});

export const clockIn = async (userId: string, date: string, clockInTime: string) => {
  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: {
      userId_date: {
        userId,
        date: new Date(date).toISOString().split('T')[0],
      },
    },
  });

  if (existingRecord && existingRecord.clockOutTime === null) {
    throw new Error('User has already clocked in for today.');
  }

  const attendanceRecord = await prisma.attendanceRecord.create({
    data: {
      userId,
      date: new Date(date),
      clockInTime: new Date(clockInTime),
    },
  });

  return attendanceRecord;
};

export const clockOut = async (userId: string, date: string, clockOutTime: string) => {
  const attendanceRecord = await prisma.attendanceRecord.findUnique({
    where: {
      userId_date: {
        userId,
        date: new Date(date).toISOString().split('T')[0],
      },
    },
  });

  if (!attendanceRecord || attendanceRecord.clockOutTime !== null) {
    throw new Error('No clock-in record found for today or already clocked out.');
  }

  const updatedRecord = await prisma.attendanceRecord.update({
    where: { id: attendanceRecord.id },
    data: {
      clockOutTime: new Date(clockOutTime),
      totalHours: Math.abs(new Date(clockOutTime).getTime() - new Date(attendanceRecord.clockInTime).getTime()) / (1000 * 60 * 60),
    },
  });

  return updatedRecord;
};

export const getAttendanceStatus = async (userId: string) => {
  const attendanceRecord = await prisma.attendanceRecord.findFirst({
    where: {
      userId,
      clockOutTime: null,
    },
  });

  return attendanceRecord ? { status: 'Clocked In', record: attendanceRecord } : { status: 'Clocked Out' };
};
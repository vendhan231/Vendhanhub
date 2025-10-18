import { z } from 'zod';

export const clockInSchema = z.object({
  date: z.string().optional(), // Optional, defaults to today's date if not provided
});

export const clockOutSchema = z.object({
  date: z.string().optional(), // Optional, defaults to today's date if not provided
});

export const attendanceStatusSchema = z.object({
  date: z.string().optional(), // Optional, defaults to today's date if not provided
});

export const validateAttendanceClockIn = (data: any) => {
  return clockInSchema.parse(data);
};

export const validateAttendanceClockOut = (data: any) => {
  return clockOutSchema.parse(data);
};

export const validateAttendance = (data: any) => {
  return attendanceStatusSchema.parse(data);
};
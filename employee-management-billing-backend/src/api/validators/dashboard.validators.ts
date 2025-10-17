import { z } from 'zod';

export const dashboardDataSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end date format",
  }),
  userId: z.string().optional(),
});

export const dashboardSummarySchema = z.object({
  totalUsers: z.number(),
  totalAttendance: z.number(),
  totalBilling: z.number(),
  totalLeaveRequests: z.number(),
});
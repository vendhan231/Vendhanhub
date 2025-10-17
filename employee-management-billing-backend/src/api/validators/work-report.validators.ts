import { z } from 'zod';

export const createWorkReportSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  projectLogItems: z.array(z.object({
    projectId: z.string().uuid(),
    hoursWorked: z.number().positive(),
    description: z.string().max(500),
    achievedCount: z.number().optional(),
  })).nonempty(),
});

export const updateWorkReportSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  projectLogItems: z.array(z.object({
    projectId: z.string().uuid(),
    hoursWorked: z.number().positive(),
    description: z.string().max(500),
    achievedCount: z.number().optional(),
  })).nonempty(),
});
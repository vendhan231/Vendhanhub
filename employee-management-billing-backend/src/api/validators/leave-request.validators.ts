import { z } from 'zod';

export const leaveRequestSchema = z.object({
  leaveType: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'OTHER']),
  startDate: z.date(),
  endDate: z.date().refine((date) => date >= new Date(), {
    message: "End date must be today or in the future",
  }),
  reason: z.string().min(1, "Reason is required"),
});

export const cancelLeaveRequestSchema = z.object({
  requestId: z.string().uuid(),
});
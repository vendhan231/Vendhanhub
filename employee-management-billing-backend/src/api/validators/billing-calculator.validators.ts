import { z } from 'zod';

export const calculateBillingSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end date format",
  }),
  userIds: z.array(z.string()).nonempty({
    message: "User IDs cannot be empty",
  }),
});

export const finalizeBillingSchema = z.object({
  billingRecords: z.array(z.object({
    userId: z.string(),
    projectId: z.string(),
    totalAchievedCount: z.number().nonnegative(),
    metricLabel: z.string(),
    formulaApplied: z.string(),
    calculatedAmountForProject: z.number().nonnegative(),
  })).nonempty({
    message: "Billing records cannot be empty",
  }),
});
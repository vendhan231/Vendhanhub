import { z } from 'zod';

export const createBillingRecordSchema = z.object({
  userId: z.string().uuid(),
  projectId: z.string().uuid(),
  clientName: z.string().min(1),
  hoursBilled: z.number().optional(),
  rateApplied: z.number().optional(),
  calculatedAmount: z.number(),
  date: z.date(),
  notes: z.string().optional(),
  isCountBased: z.boolean(),
  achievedCountTotal: z.number().optional(),
  countMetricLabelUsed: z.string().optional(),
  formulaUsed: z.string().optional(),
  billingPeriodStartDate: z.date().optional(),
  billingPeriodEndDate: z.date().optional(),
});

export const updateBillingRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  clientName: z.string().min(1).optional(),
  hoursBilled: z.number().optional(),
  rateApplied: z.number().optional(),
  calculatedAmount: z.number().optional(),
  date: z.date().optional(),
  notes: z.string().optional(),
  isCountBased: z.boolean().optional(),
  achievedCountTotal: z.number().optional(),
  countMetricLabelUsed: z.string().optional(),
  formulaUsed: z.string().optional(),
  billingPeriodStartDate: z.date().optional(),
  billingPeriodEndDate: z.date().optional(),
});

export const importBillingRecordsSchema = z.array(z.object({
  userId: z.string().uuid(),
  projectId: z.string().uuid(),
  clientName: z.string().min(1),
  hoursBilled: z.number().optional(),
  rateApplied: z.number().optional(),
  calculatedAmount: z.number(),
  date: z.date(),
  notes: z.string().optional(),
  isCountBased: z.boolean(),
  achievedCountTotal: z.number().optional(),
  countMetricLabelUsed: z.string().optional(),
  formulaUsed: z.string().optional(),
  billingPeriodStartDate: z.date().optional(),
  billingPeriodEndDate: z.date().optional(),
}));
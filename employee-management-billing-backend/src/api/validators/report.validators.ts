import { z } from 'zod';

export const createReportSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  reportData: z.record(z.any()),
  items: z.array(z.record(z.any())).min(1, 'At least one item is required'),
});

export const reportIdSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
});

export const checkDuplicateSchema = z.object({
  objectIds: z.array(z.string()),
  projectId: z.string().uuid('Invalid project ID'),
});

export const getReportsSchema = z.object({
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.string().optional(),
});
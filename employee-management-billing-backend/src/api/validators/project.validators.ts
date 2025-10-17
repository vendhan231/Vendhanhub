import { z } from 'zod';

const fieldSchema = z.object({
  label: z.string(),
  type: z.enum(['text', 'number', 'date', 'select', 'textarea']),
  options: z.array(z.string()).optional(),
  unique: z.boolean().optional(),
  required: z.boolean().optional(),
  includeInBilling: z.boolean().optional(),
});

const billingConfigSchema = z.object({
  rateType: z.enum(['per_item', 'per_record', 'per_count_field', 'custom_formula']),
  rateValue: z.number(),
  countField: z.string().optional(),
  formula: z.string().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name must be less than 255 characters'),
  fieldConfig: z.object({
    report_level: z.array(fieldSchema),
    item_level: z.array(fieldSchema),
  }),
  billingConfig: billingConfigSchema,
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name must be less than 255 characters').optional(),
  fieldConfig: z.object({
    report_level: z.array(fieldSchema),
    item_level: z.array(fieldSchema),
  }).optional(),
  billingConfig: billingConfigSchema.optional(),
});

export const projectIdSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format'),
});
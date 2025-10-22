import { z } from 'zod';

const fieldSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  type: z.enum(['text', 'number', 'date', 'select', 'textarea']),
  options: z.array(z.string()).optional(),
  unique: z.boolean().optional(),
  required: z.boolean().optional(),
  includeInBilling: z.boolean().optional(),
  order: z.number().optional(),
});

const billingConfigSchema = z.object({
  rateType: z.enum(['per_item', 'per_record', 'per_count_field', 'custom_formula']),
  rateValue: z.number(),
  countField: z.string().optional(),
  formula: z.string().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name must be less than 255 characters'),
  description: z.string().optional(),
  billing_formula: z.string().min(1, 'Billing formula is required'),
  item_fields: z.array(fieldSchema),
  edit_window_hours: z.number().min(1).max(8760).optional(),
  is_template: z.boolean().optional(),
  template_category: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name must be less than 255 characters').optional(),
  description: z.string().optional(),
  billing_formula: z.string().min(1, 'Billing formula is required').optional(),
  item_fields: z.array(fieldSchema).optional(),
  edit_window_hours: z.number().min(1).max(8760).optional(),
  is_template: z.boolean().optional(),
  template_category: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const projectIdSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format'),
});

export const createProjectValidator = (data: any) => {
  return createProjectSchema.parse(data);
};

export const updateProjectValidator = (data: any) => {
  return updateProjectSchema.parse(data);
};
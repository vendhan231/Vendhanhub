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
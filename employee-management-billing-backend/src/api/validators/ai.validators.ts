import { z } from 'zod';

export const generateContentSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
});

export const generateContentResponseSchema = z.object({
  generatedText: z.string(),
});
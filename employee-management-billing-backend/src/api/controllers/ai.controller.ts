import { Request, Response } from 'express';
import { generate } from '../services/gemini.service';
import { z } from 'zod';

const promptSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
});

export const generateContent = async (req: Request, res: Response) => {
  try {
    const { prompt } = promptSchema.parse(req.body);
    const result = await generate(prompt);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
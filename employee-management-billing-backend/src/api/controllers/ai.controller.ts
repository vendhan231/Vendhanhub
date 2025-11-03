import { Request, Response } from 'express';
import { generate as generateService } from '../services/gemini.service';
import { aiRequestSchema } from '../validators/ai.validators';

export const generate = async (req: Request, res: Response) => {
  try {
    const { prompt } = aiRequestSchema(req.body);
    const result = await generateService(prompt);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
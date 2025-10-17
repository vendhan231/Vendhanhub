import { Request, Response } from 'express';
import { calculateBillingPeriod, finalizeBilling } from '../services/billing-calculator.service';
import { z } from 'zod';

const calculateSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end date",
  }),
});

const finalizeSchema = z.object({
  userIds: z.array(z.string()).nonempty(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end date",
  }),
});

export const calculate = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = calculateSchema.parse(req.body);
    const result = await calculateBillingPeriod(startDate, endDate);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const finalize = async (req: Request, res: Response) => {
  try {
    const { userIds, startDate, endDate } = finalizeSchema.parse(req.body);
    const result = await finalizeBilling({ userIds, startDate, endDate });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
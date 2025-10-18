import { Request, Response } from 'express';
import { calculateBillingPeriod, finalizeBilling as finalizeBillingService } from '../services/billing-calculator.service';
import { calculateBillingValidator, finalizeBillingValidator } from '../validators/billing-calculator.validators';

export const calculateBilling = async (req: Request, res: Response) => {
  try {
    const validatedData = calculateBillingValidator(req.body);
    const result = await calculateBillingPeriod(new Date(validatedData.startDate), new Date(validatedData.endDate));
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const finalizeBilling = async (req: Request, res: Response) => {
  try {
    const validatedData = finalizeBillingValidator(req.body);
    // Calculate summaries first
    const summaries = await calculateBillingPeriod(new Date(), new Date()); // TODO: Fix date parameters
    const result = await finalizeBillingService(summaries);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
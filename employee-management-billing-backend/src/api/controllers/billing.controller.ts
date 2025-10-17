import { Request, Response } from 'express';
import * as billingService from '../services/billing.service';
import { ZodError } from 'zod';

export const getBillingRecords = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.role === 'ADMIN' ? undefined : user.id;

    const billingRecords = await billingService.getBillingRecords(userId);
    res.status(200).json(billingRecords);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateBillingStatus = async (req: Request, res: Response) => {
  try {
    const { billingId } = req.params;
    const { status } = req.body;
    const user = (req as any).user;

    const userId = user.role === 'ADMIN' ? undefined : user.id;

    const updatedBilling = await billingService.updateBillingStatus(billingId, status, userId);
    res.status(200).json(updatedBilling);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBillingRecord = async (req: Request, res: Response) => {
  try {
    const { billingId } = req.params;
    const user = (req as any).user;

    const userId = user.role === 'ADMIN' ? undefined : user.id;

    await billingService.deleteBillingRecord(billingId, userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBillingAnalytics = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const analytics = await billingService.getBillingAnalytics();
    res.status(200).json(analytics);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBillingByProject = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const projectBilling = await billingService.getBillingByProject();
    res.status(200).json(projectBilling);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBillingByUser = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const userBilling = await billingService.getBillingByUser();
    res.status(200).json(userBilling);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
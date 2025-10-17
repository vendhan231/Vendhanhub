import { Request, Response } from 'express';
import { z } from 'zod';
import { BillingService } from '../services/billing.service';
import { validateBillingRecord } from '../validators/billing.validators';

const billingService = new BillingService();

export const createBillingRecord = async (req: Request, res: Response) => {
    try {
        const validatedData = validateBillingRecord.parse(req.body);
        const billingRecord = await billingService.createBillingRecord(validatedData);
        res.status(201).json(billingRecord);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getBillingRecords = async (req: Request, res: Response) => {
    try {
        const billingRecords = await billingService.getBillingRecords();
        res.status(200).json(billingRecords);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve billing records' });
    }
};

export const importBillingRecordsFromCSV = async (req: Request, res: Response) => {
    try {
        const result = await billingService.importBillingRecordsFromCSV(req.file.path);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to import billing records' });
    }
};

export const updateBillingRecord = async (req: Request, res: Response) => {
    const { billingRecordId } = req.params;
    try {
        const validatedData = validateBillingRecord.parse(req.body);
        const updatedRecord = await billingService.updateBillingRecord(billingRecordId, validatedData);
        res.status(200).json(updatedRecord);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteBillingRecord = async (req: Request, res: Response) => {
    const { billingRecordId } = req.params;
    try {
        await billingService.deleteBillingRecord(billingRecordId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete billing record' });
    }
};
import { Request, Response } from 'express';
import { z } from 'zod';
import { DailyWorkReportService } from '../services/work-report.service';
import { validateWorkReport } from '../validators/work-report.validators';

const workReportService = new DailyWorkReportService();

export const createWorkReport = async (req: Request, res: Response) => {
    try {
        const validatedData = validateWorkReport.parse(req.body);
        const userId = req.user.id; // Assuming user ID is attached to req.user by auth middleware
        const report = await workReportService.createReport(userId, validatedData);
        res.status(201).json(report);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateWorkReport = async (req: Request, res: Response) => {
    try {
        const reportId = req.params.reportId;
        const validatedData = validateWorkReport.parse(req.body);
        const updatedReport = await workReportService.updateReport(reportId, validatedData);
        res.status(200).json(updatedReport);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getWorkReport = async (req: Request, res: Response) => {
    try {
        const reportId = req.params.reportId;
        const report = await workReportService.getReport(reportId);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.status(200).json(report);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteWorkReport = async (req: Request, res: Response) => {
    try {
        const reportId = req.params.reportId;
        await workReportService.deleteReport(reportId);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
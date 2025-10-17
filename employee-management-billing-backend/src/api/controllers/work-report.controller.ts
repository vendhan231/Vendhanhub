import { Request, Response } from 'express';
import { createWorkReport as createWorkReportService } from '../services/work-report.service';

export const createWorkReport = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || 'current-user'; // Get user ID from auth middleware
        const report = await createWorkReportService(userId, req.body);

        // Emit real-time update to all connected clients
        const io = (global as any).io;
        if (io) {
            io.emit('work-report-created', {
                userId,
                report,
                timestamp: new Date().toISOString()
            });
        }

        res.status(201).json(report);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to create work report' });
    }
};

export const updateWorkReport = async (req: Request, res: Response) => {
    try {
        const reportId = req.params.reportId;
        const userId = (req as any).user?.id || 'current-user';
        const updatedReport = await createWorkReportService(userId, { ...req.body, reportId });

        // Emit real-time update
        const io = (global as any).io;
        if (io) {
            io.emit('work-report-updated', {
                userId,
                reportId,
                report: updatedReport,
                timestamp: new Date().toISOString()
            });
        }

        res.status(200).json(updatedReport);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to update work report' });
    }
};

export const getWorkReport = async (req: Request, res: Response) => {
    try {
        const reportId = req.params.reportId;
        // For now, return a placeholder - implement actual service method later
        res.status(200).json({ id: reportId, message: 'Report retrieval not implemented yet' });
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to get work report' });
    }
};

export const deleteWorkReport = async (req: Request, res: Response) => {
    try {
        const reportId = req.params.reportId;

        // Emit real-time update
        const io = (global as any).io;
        if (io) {
            io.emit('work-report-deleted', {
                reportId,
                timestamp: new Date().toISOString()
            });
        }

        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to delete work report' });
    }
};
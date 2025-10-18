import type { Request, Response } from 'express-serve-static-core';
import * as reportService from '../services/report.service';
import * as reportValidators from '../validators/report.validators';
import { ZodError } from 'zod';

export const createReport = async (req: Request, res: Response) => {
  try {
    const validatedData = reportValidators.createReportSchema.parse(req.body);
    const userId = (req as any).user.id; // From auth middleware

    const result = await reportService.createReport({
      ...validatedData,
      userId,
    });

    // Ensure result is properly typed
    if (!result.report || !result.billing) {
      throw new Error('Invalid report creation result');
    }

    res.status(201).json({
      message: 'Report submitted successfully',
      report: result.report,
      billing: result.billing,
      billingAmount: result.billing.calculatedAmount,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    res.status(400).json({ message: error.message });
  }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    const validatedQuery = reportValidators.getReportsSchema.parse(req.query);
    const user = (req as any).user;

    // If not admin, only show user's own reports
    const userId = user.role === 'ADMIN' ? validatedQuery.userId : user.id;

    const reports = await reportService.getReports(userId, validatedQuery.projectId);
    res.status(200).json(reports);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    res.status(400).json({ message: error.message });
  }
};

export const getReportById = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const user = (req as any).user;

    const report = await reportService.getReportById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check permissions
    if (user.role !== 'ADMIN' && report.userId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json(report);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const checkDuplicateObjectIds = async (req: Request, res: Response) => {
  try {
    const validatedData = reportValidators.checkDuplicateSchema.parse(req.body);
    const duplicates = await reportService.checkDuplicateObjectIds(
      validatedData.objectIds,
      validatedData.projectId
    );
    res.status(200).json(duplicates);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    res.status(400).json({ message: error.message });
  }
};
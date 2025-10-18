import { Request, Response } from 'express';
import { z } from 'zod';
import { workReportService } from '../services/work-report.service';
import { FileProcessor, ProcessedFileData } from '../../utils/fileProcessor';

// Validation schemas
const submitWorkReportSchema = z.object({
  projectId: z.string(),
  date: z.string(),
  objectId: z.string(),
  description: z.string().optional(),
  customFields: z.record(z.any()),
  hoursWorked: z.number().optional(),
});

const processFilesSchema = z.object({
  projectId: z.string(),
});

export const submitWorkReport = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedData = submitWorkReportSchema.parse(req.body);

    const workReport = await (workReportService as any).submitWorkReport({
      ...validatedData,
      userId: user.id,
      submittedAt: new Date(),
    });

    // Emit real-time update for admin dashboard
    if ((global as any).io) {
      (global as any).io.emit('workReportSubmitted', {
        userId: user.id,
        userName: user.username,
        projectId: validatedData.projectId,
        timestamp: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Work report submitted successfully',
      data: workReport
    });
  } catch (error) {
    console.error('Work report submission error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to submit work report'
    });
  }
};

export const processFiles = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedData = processFilesSchema.parse(req.body);
    const files = (req as any).files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const processedResults: ProcessedFileData[] = [];

    for (const file of files) {
      const result = await FileProcessor.processFile(file);

      if (result.success && result.data) {
        processedResults.push(result.data);
      } else {
        console.error(`Failed to process file ${file.originalname}:`, result.error);
      }
    }

    // Check for duplicates across all files
    const allObjectIds = processedResults.flatMap(p => p.objectIds);
    const duplicates = FileProcessor.detectDuplicates(allObjectIds);

    res.status(200).json({
      success: true,
      data: {
        files: processedResults,
        totalFiles: processedResults.length,
        totalRecords: processedResults.reduce((sum, p) => sum + p.totalRecords, 0),
        duplicates,
        hasDuplicates: duplicates.length > 0,
      }
    });
  } catch (error) {
    console.error('File processing error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to process files'
    });
  }
};

export const calculateBilling = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { projectId, fieldValues, formula } = req.body;

    if (!projectId || !fieldValues || !formula) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Replace field names in formula with actual values
    let calculatedFormula = formula;
    Object.entries(fieldValues).forEach(([fieldName, value]) => {
      const regex = new RegExp(fieldName, 'g');
      calculatedFormula = calculatedFormula.replace(regex, String(value));
    });

    // Calculate result using Function constructor for safety
    const result = new Function('return ' + calculatedFormula)();

    res.status(200).json({
      success: true,
      result: Number(result) || 0,
      formula: calculatedFormula,
    });
  } catch (error) {
    console.error('Billing calculation error:', error);
    res.status(400).json({
      error: 'Invalid formula or calculation error'
    });
  }
};

export const getWorkReports = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { projectId, startDate, endDate } = req.query;

    const filters: any = {};
    if (projectId) filters.projectId = projectId;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const workReports = await (workReportService as any).getWorkReports(user.id, filters);

    res.status(200).json({
      success: true,
      data: workReports
    });
  } catch (error) {
    console.error('Get work reports error:', error);
    res.status(500).json({
      error: 'Failed to retrieve work reports'
    });
  }
};

export const downloadWorkReport = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { reportId } = req.params;

    const reportData = await (workReportService as any).getWorkReportById(reportId, user.id);

    if (!reportData) {
      return res.status(404).json({ error: 'Work report not found' });
    }

    // Generate CSV content
    const csvHeaders = ['Date', 'Project', 'Object ID', 'Description', 'Status', 'Billing Amount'];
    const csvRows = [
      reportData.date,
      reportData.projectName || '',
      reportData.objectId,
      reportData.description || '',
      reportData.status,
      reportData.billingAmount || '0'
    ];

    const csvContent = [csvHeaders, csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="work-report-${reportId}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Download work report error:', error);
    res.status(500).json({
      error: 'Failed to download work report'
    });
  }
};
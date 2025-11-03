import { Request, Response } from 'express';
import multer from 'multer';
import { extractDataFromFile, mapFieldsToProject } from '../services/fileUpload.service';
import * as projectService from '../services/project.service';
import { ZodError } from 'zod';

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

export const uploadMiddleware = upload.single('file');

export const extractFields = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const projectId = req.body.projectId;
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    // Get project configuration
    const project = await projectService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Extract data from file
    const extractedData = await extractDataFromFile(req.file.buffer, req.file.mimetype);

    // Map fields to project configuration - improved field matching
    const fieldConfig = {
      report_level: [],
      item_level: project.item_fields || []
    };
    const mappedData = mapFieldsToProject(extractedData, fieldConfig);

    // Calculate billing preview if there's data
    let billingPreview = null;
    if (mappedData.items.length > 0) {
      try {
        // Get field and billing config from project response
        const fieldConfig = project.item_fields || [];
        const billingConfig = {
          rateType: 'custom_formula',
          formula: project.billing_formula || '',
          rateValue: 0
        };

        let totalAmount = 0;
        if (billingConfig.rateType === 'custom_formula' && billingConfig.formula) {
          // Calculate using custom formula for each item
          for (const item of mappedData.items) {
            const fieldValues: Record<string, any> = {};

            // Extract numeric field values from item data - improved field matching
            fieldConfig.forEach((field: any) => {
              if (field.type === 'number' && field.includeInBilling && item[field.label] !== undefined) {
                fieldValues[field.label] = parseFloat(item[field.label]) || 0;
              }
            });

            // Evaluate formula for this item
            try {
              const itemAmount = Function('"use strict"; return (' + billingConfig.formula.replace(/(\w+)/g, (match: string) => fieldValues[match] !== undefined ? fieldValues[match] : match) + ')')();
              totalAmount += itemAmount;
            } catch (error) {
              console.warn('Formula evaluation failed for item:', error);
            }
          }
        } else if (billingConfig.rateType === 'per_item') {
          totalAmount = mappedData.items.length * billingConfig.rateValue;
        } else if (billingConfig.rateType === 'per_record') {
          totalAmount = billingConfig.rateValue;
        } else if (billingConfig.rateType === 'per_count_field') {
          // For now, skip this case as countField is not defined in current config
          totalAmount = 0;
        }

        billingPreview = {
          totalItems: mappedData.items.length,
          totalCount: mappedData.items.length,
          rate: billingConfig.rateValue || 0,
          billingAmount: totalAmount,
          formulaApplied: billingConfig.rateType === 'custom_formula' ? billingConfig.formula : billingConfig.rateType,
        };
      } catch (error) {
        console.warn('Could not calculate billing preview:', error);
      }
    }

    res.status(200).json({
      message: 'Data extracted successfully',
      extractedData: mappedData,
      billingPreview,
      rawData: extractedData.slice(0, 5), // Return first 5 rows for preview
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
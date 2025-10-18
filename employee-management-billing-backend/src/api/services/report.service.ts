import { PrismaClient } from '@prisma/client';
import { Prisma, Report, BillingRecord, ReportItem, ObjectIDIndex } from '@prisma/client';
import * as billingService from './billing.service';

const prisma = new PrismaClient();

interface ReportData {
  projectId: string;
  userId: string;
  reportData: Record<string, any>;
  items: Array<Record<string, any>>;
}

interface CreateReportResult {
  report: {
    id: string;
    projectId: string;
    userId: string;
    reportData: string;
    createdAt: Date;
    updatedAt: Date;
  };
  reportItems: Array<{
    id: string;
    reportId: string;
    itemData: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  billing: {
    id: string;
    reportId: string;
    userId: string;
    projectId: string;
    projectName: string;
    totalItems: number;
    totalCount: number;
    rate: number;
    billingAmount: number;
    createdAt: Date;
    updatedAt: Date;
  };
  objectIdIndices: Array<{
    id: string;
    objectId: string;
    reportId: string;
    projectId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export const createReport = async (data: ReportData) => {
  const { projectId, userId, reportData, items } = data;

  // Get project to validate fields
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new Error('Project not found');

  const fieldConfig = JSON.parse(project.fieldConfig || '{}');
  const billingConfig = JSON.parse(project.billingConfig || '{}');

  // Validate report-level fields
  for (const field of fieldConfig.report_level) {
    if (field.required && !reportData[field.label]) {
      throw new Error(`Required field '${field.label}' is missing`);
    }
  }

  // Validate item-level fields and check for duplicates
  const objectIds: string[] = [];
  for (const item of items) {
    for (const field of fieldConfig.item_level) {
      if (field.required && !item[field.label]) {
        throw new Error(`Required field '${field.label}' is missing in item`);
      }
      if (field.unique && field.label.toLowerCase() === 'object id') {
        const objectId = item[field.label];
        if (objectIds.includes(objectId)) {
          throw new Error(`Duplicate Object ID '${objectId}' within this report`);
        }
        objectIds.push(objectId);
      }
    }
  }

  // Check for duplicate Object IDs across all reports
  if (objectIds.length > 0) {
    const existingObjectIds = await prisma.objectIDIndex.findMany({
      where: {
        objectId: { in: objectIds },
        projectId,
      },
    });
    if (existingObjectIds.length > 0) {
      const duplicates = existingObjectIds.map(e => e.objectId);
      throw new Error(`Duplicate Object IDs found: ${duplicates.join(', ')}`);
    }
  }

  // Create report first
  const report = await prisma.report.create({
    data: {
      projectId,
      userId,
      reportData: JSON.stringify(reportData),
    },
  });

  // Calculate billing using the new service
  const billingCalculation = await billingService.calculateBillingAmount(report.id);
  const { totalItems, totalCount, rate, billingAmount } = billingCalculation;

  // Create report items
  const reportItems = await Promise.all(
    items.map(item => 
      prisma.reportItem.create({
        data: {
          reportId: report.id,
          itemData: JSON.stringify(item),
        },
      })
    )
  );

  // Create billing record
  const billing = await prisma.billingRecord.create({
    data: {
      userId,
      projectId,
      projectName: project.name, // project is guaranteed to exist from earlier check
      clientName: project.name, // Using project name as client name for now
      hoursBilled: totalItems,
      rateApplied: rate,
      calculatedAmount: billingAmount,
      date: new Date(),
      isCountBased: false,
    },
  });

  // Create Object ID indices
  const objectIdIndices = await Promise.all(
    objectIds.map(objectId => 
      prisma.objectIDIndex.create({
        data: {
          objectId,
          reportId: report.id,
          projectId,
          userId,
        },
      })
    )
  );

  return {
    report,
    reportItems,
    billing,
    objectIdIndices,
  };
};

export const getReports = async (userId?: string, projectId?: string) => {
  const where: any = {};
  if (userId) where.userId = userId;
  if (projectId) where.projectId = projectId;

  const reports = await prisma.report.findMany({
    where,
    include: {
      user: true,
      project: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return reports.map(report => ({
    ...report,
    reportData: JSON.parse(report.reportData),
    items: report.items.map(item => JSON.parse(item.itemData)),
  }));
};

export const getReportById = async (id: string) => {
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      user: true,
      project: true,
      items: true,
    },
  });

  if (!report) return null;

  return {
    ...report,
    reportData: JSON.parse(report.reportData),
    items: report.items.map(item => JSON.parse(item.itemData)),
  };
};

export const checkDuplicateObjectIds = async (objectIds: string[], projectId: string) => {
  const duplicates = await prisma.objectIDIndex.findMany({
    where: {
      objectId: { in: objectIds },
      projectId,
    },
    include: {
      report: {
        include: {
          user: true,
        },
      },
    },
  });

  return duplicates.map(d => ({
    objectId: d.objectId,
    reportId: d.reportId,
    user: d.report.user,
    date: d.report.createdAt,
  }));
};
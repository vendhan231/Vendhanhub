import { PrismaClient } from '@prisma/client';
import { DailyWorkReport, ProjectLogItem } from '@prisma/client';
import { z } from 'zod';
import { createWorkReportSchema, updateWorkReportSchema } from '../validators/work-report.validators';

const prisma = new PrismaClient();

export const createWorkReport = async (userId: string, data: any) => {
  const validatedData = createWorkReportSchema.parse(data);
  
  const dailyWorkReport = await prisma.dailyWorkReport.upsert({
    where: {
      userId_date: {
        userId,
        date: validatedData.date,
      },
    },
    create: {
      userId,
      date: validatedData.date,
      submittedAt: new Date(),
      projectLogItems: {
        create: validatedData.projectLogItems,
      },
    },
    update: {
      projectLogItems: {
        deleteMany: {},
        create: validatedData.projectLogItems,
      },
    },
  });

  return dailyWorkReport;
};

export const updateWorkReport = async (userId: string, reportId: string, data: any) => {
  const validatedData = updateWorkReportSchema.parse(data);

  const existingReport = await prisma.dailyWorkReport.findUnique({
    where: { id: reportId },
  });

  if (!existingReport || existingReport.userId !== userId) {
    throw new Error('Report not found or you do not have permission to update it.');
  }

  const updatedReport = await prisma.dailyWorkReport.update({
    where: { id: reportId },
    data: {
      projectLogItems: {
        deleteMany: {},
        create: validatedData.projectLogItems,
      },
    },
  });

  return updatedReport;
};
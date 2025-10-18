import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WorkReportData {
  projectId: string;
  userId: string;
  date: string;
  objectId: string;
  description?: string;
  customFields: Record<string, any>;
  hoursWorked?: number;
  submittedAt: Date;
  status?: string;
  billingAmount?: number;
}

export interface WorkReportFilters {
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class WorkReportService {
  async submitWorkReport(data: WorkReportData) {
    try {
      // Get project details for billing calculation
      const project = await prisma.project.findUnique({
        where: { id: data.projectId }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Calculate billing amount based on project formula
      let billingAmount = 0;
      if (project.fieldConfig) {
        const config = JSON.parse(project.fieldConfig);
        billingAmount = WorkReportService.calculateBilling(data.customFields, config.formula);
      }

      // Create work report
      const workReport = await prisma.dailyWorkReport.create({
        data: {
          userId: data.userId,
          date: new Date(data.date),
          submittedAt: data.submittedAt,
          projectLogItems: {
            create: {
              projectId: data.projectId,
              projectName: project.name,
              hoursWorked: data.hoursWorked || 0,
              description: data.description || '',
              achievedCount: WorkReportService.extractAchievedCount(data.customFields),
            }
          }
        },
        include: {
          projectLogItems: true
        }
      });

      // Create billing record if amount > 0
      if (billingAmount > 0) {
        await prisma.billingRecord.create({
          data: {
            userId: data.userId,
            projectId: data.projectId,
            projectName: project.name,
            calculatedAmount: billingAmount,
            date: new Date(data.date),
            status: 'PENDING',
            isCountBased: true,
            achievedCountTotal: WorkReportService.extractAchievedCount(data.customFields),
            details: data.customFields,
          }
        } as any);
      }

      return {
        id: workReport.id,
        projectId: data.projectId,
        date: data.date,
        objectId: data.objectId,
        billingAmount,
        status: 'SUBMITTED'
      };
    } catch (error) {
      console.error('Work report submission error:', error);
      throw error;
    }
  }

  static async getWorkReports(userId: string, filters?: WorkReportFilters) {
    try {
      const whereClause: any = {
        userId,
      };

      if (filters?.projectId) {
        whereClause.projectLogItems = {
          some: {
            projectId: filters.projectId
          }
        };
      }

      if (filters?.startDate || filters?.endDate) {
        whereClause.date = {};
        if (filters.startDate) {
          whereClause.date.gte = filters.startDate;
        }
        if (filters.endDate) {
          whereClause.date.lte = filters.endDate;
        }
      }

      const workReports = await prisma.dailyWorkReport.findMany({
        where: whereClause,
        include: {
          projectLogItems: {
            include: {
              project: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      return workReports.map(report => ({
        id: report.id,
        date: report.date,
        submittedAt: report.submittedAt,
        projectLogItems: report.projectLogItems.map(item => ({
          id: item.id,
          projectName: item.projectName,
          hoursWorked: item.hoursWorked,
          description: item.description,
          achievedCount: item.achievedCount,
        }))
      }));
    } catch (error) {
      console.error('Get work reports error:', error);
      throw error;
    }
  }

  static async getWorkReportById(reportId: string, userId: string) {
    try {
      const workReport = await prisma.dailyWorkReport.findFirst({
        where: {
          id: reportId,
          userId
        },
        include: {
          projectLogItems: {
            include: {
              project: true
            }
          }
        }
      });

      if (!workReport) {
        throw new Error('Work report not found');
      }

      return {
        id: workReport.id,
        date: workReport.date,
        description: workReport.projectLogItems[0]?.description,
        projectName: workReport.projectLogItems[0]?.projectName,
        objectId: workReport.projectLogItems[0]?.projectName || 'N/A', // This should be stored separately
        status: 'SUBMITTED',
        billingAmount: 0, // This should be calculated from billing records
      };
    } catch (error) {
      console.error('Get work report by ID error:', error);
      throw error;
    }
  }

  private static calculateBilling(fieldValues: Record<string, any>, formula: string): number {
    try {
      let calculatedFormula = formula;

      // Replace field names with values
      Object.entries(fieldValues).forEach(([fieldName, value]) => {
        const regex = new RegExp(fieldName, 'g');
        calculatedFormula = calculatedFormula.replace(regex, String(value));
      });

      // Calculate result
      const result = new Function('return ' + calculatedFormula)();
      return Number(result) || 0;
    } catch (error) {
      console.error('Billing calculation error:', error);
      return 0;
    }
  }

  private static extractAchievedCount(fieldValues: Record<string, any>): number {
    // Extract numeric values that represent counts
    const numericValues = Object.values(fieldValues)
      .filter(value => typeof value === 'number')
      .map(value => Number(value));

    return numericValues.length > 0 ? Math.max(...numericValues) : 0;
  }

  static async getWorkReportStats(userId: string) {
    try {
      const totalReports = await prisma.dailyWorkReport.count({
        where: { userId }
      });

      return {
        totalReports,
        totalHours: 0, // Calculate from project log items
        totalEarnings: 0, // Calculate from billing records
      };
    } catch (error) {
      console.error('Get work report stats error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const workReportService = new WorkReportService();
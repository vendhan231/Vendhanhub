import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WorkReportData {
  userId: string;
  date: string;
  projectLogs: {
    projectId: string;
    hoursWorked?: number;
    description?: string;
    achievedCount?: number;
    customFields: Record<string, any>;
  }[];
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
      if (data.projectLogs.length === 0) {
        throw new Error('No project logs provided');
      }

      const projectId = data.projectLogs[0].projectId;
      // Get project details for billing calculation
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Calculate billing amount based on all logs
      let billingAmount = 0;
      if (project.fieldConfig) {
        const config = JSON.parse(project.fieldConfig);
        // Sum up all customFields
        const allCustomFields = data.projectLogs.reduce((acc, log) => {
          Object.entries(log.customFields).forEach(([key, value]) => {
            acc[key] = (acc[key] || 0) + (typeof value === 'number' ? value : 0);
          });
          return acc;
        }, {} as Record<string, any>);
        billingAmount = WorkReportService.calculateBilling(allCustomFields, config.formula);
      }

      // Create work report
      const workReport = await prisma.dailyWorkReport.create({
        data: {
          userId: data.userId,
          date: new Date(data.date),
          submittedAt: data.submittedAt,
          projectLogItems: {
            create: data.projectLogs.map(log => ({
              projectId: log.projectId,
              projectName: project.name,
              hoursWorked: log.hoursWorked || 0,
              description: log.description || '',
              achievedCount: log.achievedCount || 0,
            }))
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
            projectId: projectId,
            projectName: project.name,
            calculatedAmount: billingAmount,
            date: new Date(data.date),
            status: 'PENDING',
            isCountBased: true,
            achievedCountTotal: data.projectLogs.reduce((sum, log) => sum + (log.achievedCount || 0), 0),
            details: data.projectLogs.map(log => log.customFields),
          }
        } as any);
      }

      return {
        id: workReport.id,
        projectId: projectId,
        date: data.date,
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

      // Fetch billing records for the user
      const billingRecords = await prisma.billingRecord.findMany({
        where: {
          userId,
          date: {
            gte: filters?.startDate || new Date(0),
            lte: filters?.endDate || new Date(),
          }
        }
      });

      return workReports.map(report => {
        // Find billing for this report
        const billing = billingRecords.find(b => b.date.toISOString().split('T')[0] === report.date.toISOString().split('T')[0] && b.projectId === report.projectLogItems[0]?.projectId);

        return {
          id: report.id,
          date: report.date,
          submittedAt: report.submittedAt,
          projectLogItems: report.projectLogItems.map(item => ({
            id: item.id,
            projectName: item.projectName,
            hoursWorked: item.hoursWorked,
            description: item.description,
            achievedCount: item.achievedCount,
            billing: billing ? { calculatedPay: billing.calculatedAmount } : undefined,
          }))
        };
      });
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
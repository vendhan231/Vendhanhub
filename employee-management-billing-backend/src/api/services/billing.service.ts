import config from '../../config';

const prisma = config.prisma;

// Helper function to evaluate custom billing formula
const evaluateFormula = (formula: string, fieldValues: Record<string, any>): number => {
  try {
    let processedFormula = formula;

    // Replace field names with their values
    Object.entries(fieldValues).forEach(([fieldName, value]) => {
      const regex = new RegExp(`\\b${fieldName}\\b`, 'g');
      processedFormula = processedFormula.replace(regex, value?.toString() || '0');
    });

    // Evaluate the formula safely
    return Function('"use strict"; return (' + processedFormula + ')')();
  } catch (error) {
    throw new Error(`Formula evaluation failed: ${(error as Error).message}`);
  }
};

export const getBillingRecords = async (userId?: string) => {
  const where: any = {};
  if (userId) where.userId = userId;

  const billingRecords = await prisma.billingRecord.findMany({
    where,
    include: {
      user: true,
      project: true,
      report: {
        include: {
          items: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return billingRecords;
};

export const updateBillingStatus = async (billingId: string, status: string, userId?: string) => {
  const billing = await prisma.billingRecord.findUnique({
    where: { id: billingId },
    include: { user: true },
  });

  if (!billing) throw new Error('Billing record not found');

  // Check permissions - only admin or the user who owns the billing can update
  if (userId && userId !== billing.userId) {
    throw new Error('Access denied');
  }

  return await prisma.billingRecord.update({
    where: { id: billingId },
    data: { status },
  });
};

export const deleteBillingRecord = async (billingId: string, userId?: string) => {
  const billing = await prisma.billingRecord.findUnique({
    where: { id: billingId },
    include: { user: true },
  });

  if (!billing) throw new Error('Billing record not found');

  // Check permissions - only admin or the user who owns the billing can delete
  if (userId && userId !== billing.userId) {
    throw new Error('Access denied');
  }

  return await prisma.billingRecord.delete({
    where: { id: billingId },
  });
};

export const getBillingAnalytics = async () => {
  const [
    totalBilling,
    pendingBilling,
    approvedBilling,
    paidBilling,
    monthlyBilling,
  ] = await Promise.all([
    prisma.billingRecord.aggregate({
      _sum: { billingAmount: true },
    }),
    prisma.billingRecord.aggregate({
      _sum: { billingAmount: true },
      where: { status: 'PENDING' },
    }),
    prisma.billingRecord.aggregate({
      _sum: { billingAmount: true },
      where: { status: 'APPROVED' },
    }),
    prisma.billingRecord.aggregate({
      _sum: { billingAmount: true },
      where: { status: 'PAID' },
    }),
    prisma.billingRecord.aggregate({
      _sum: { billingAmount: true },
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  const totalProjects = await prisma.project.count();
  const totalUsers = await prisma.user.count();
  const totalReports = await prisma.report.count();

  return {
    summary: {
      totalBilling: totalBilling._sum.billingAmount || 0,
      pendingBilling: pendingBilling._sum.billingAmount || 0,
      approvedBilling: approvedBilling._sum.billingAmount || 0,
      paidBilling: paidBilling._sum.billingAmount || 0,
      monthlyBilling: monthlyBilling._sum.billingAmount || 0,
    },
    counts: {
      totalProjects,
      totalUsers,
      totalReports,
    },
  };
};

export const getBillingByProject = async () => {
  const projectBilling = await prisma.billingRecord.groupBy({
    by: ['projectId'],
    _sum: { billingAmount: true, totalItems: true },
    _count: { id: true },
    orderBy: { _sum: { billingAmount: 'desc' } },
  });

  const projects = await prisma.project.findMany({
    where: {
      id: { in: projectBilling.map(p => p.projectId) },
    },
  });

  return projectBilling.map(billing => {
    const project = projects.find(p => p.id === billing.projectId);
    return {
      projectId: billing.projectId,
      projectName: project?.name || 'Unknown',
      totalBilling: billing._sum.billingAmount || 0,
      totalItems: billing._sum.totalItems || 0,
      reportCount: billing._count.id,
    };
  });
};

export const getBillingByUser = async () => {
  const userBilling = await prisma.billingRecord.groupBy({
    by: ['userId'],
    _sum: { billingAmount: true },
    _count: { id: true },
    orderBy: { _sum: { billingAmount: 'desc' } },
  });

  const users = await prisma.user.findMany({
    where: {
      id: { in: userBilling.map(u => u.userId) },
    },
  });

  return userBilling.map(billing => {
    const user = users.find(u => u.id === billing.userId);
    return {
      userId: billing.userId,
      userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
      totalBilling: billing._sum.billingAmount || 0,
      reportCount: billing._count.id,
    };
  });
};

// Calculate billing amount for a report based on project configuration
export const calculateBillingAmount = async (reportId: string) => {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      project: true,
      items: true,
    },
  });

  if (!report) throw new Error('Report not found');
  if (!report.project) throw new Error('Project not found for report');

  const project = report.project;
  const fieldConfig = JSON.parse(project.fieldConfig || '{}');
  const billingConfig = JSON.parse(project.billingConfig || '{}');

  let totalAmount = 0;

  if (billingConfig.rateType === 'custom_formula' && billingConfig.formula) {
    // Calculate using custom formula for each item
    for (const item of report.items) {
      const itemData = JSON.parse(item.itemData || '{}');
      const fieldValues: Record<string, any> = {};

      // Extract numeric field values from item data
      fieldConfig.item_level?.forEach((field: any) => {
        if (field.type === 'number' && field.includeInBilling && itemData[field.label] !== undefined) {
          fieldValues[field.label] = parseFloat(itemData[field.label]) || 0;
        }
      });

      // Evaluate formula for this item
      const itemAmount = evaluateFormula(billingConfig.formula, fieldValues);
      totalAmount += itemAmount;
    }
  } else if (billingConfig.rateType === 'per_item') {
    totalAmount = report.items.length * billingConfig.rateValue;
  } else if (billingConfig.rateType === 'per_record') {
    totalAmount = billingConfig.rateValue;
  } else if (billingConfig.rateType === 'per_count_field') {
    // Sum up the count field from all items
    let totalCount = 0;
    for (const item of report.items) {
      const itemData = JSON.parse(item.itemData || '{}');
      totalCount += parseFloat(itemData[billingConfig.countField] || '0');
    }
    totalAmount = totalCount * billingConfig.rateValue;
  }

  return {
    totalItems: report.items.length,
    totalCount: report.items.length, // For backward compatibility
    rate: billingConfig.rateValue || 0,
    billingAmount: totalAmount,
    formulaApplied: billingConfig.rateType === 'custom_formula' ? billingConfig.formula : billingConfig.rateType,
  };
};
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get Object ID registry with filtering and search
export const getObjectIdRegistry = async (req: any, res: any) => {
  try {
    const {
      search,
      projectId,
      userId,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let whereClause: any = {};

    if (search) {
      whereClause.objectId = {
        contains: search
      };
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    const [objectIds, totalCount] = await Promise.all([
      prisma.objectIDIndex.findMany({
        where: whereClause,
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: offset,
        take: limitNum
      }),
      prisma.objectIDIndex.count({
        where: whereClause
      })
    ]);

    // Get related data for each Object ID entry
    const formattedObjectIds = await Promise.all(
      objectIds.map(async (obj) => {
        const [user, project, report] = await Promise.all([
          prisma.user.findUnique({
            where: { id: obj.userId },
            select: {
              username: true,
              firstName: true,
              lastName: true,
              department: true
            }
          }),
          prisma.project.findUnique({
            where: { id: obj.projectId },
            select: {
              name: true,
              is_active: true
            }
          }),
          prisma.report.findUnique({
            where: { id: obj.reportId },
            select: {
              createdAt: true
            }
          })
        ]);

        return {
          id: obj.id,
          objectId: obj.objectId,
          projectId: obj.projectId,
          projectName: project?.name || 'Unknown Project',
          userId: obj.userId,
          userName: user?.username || 'Unknown User',
          userFullName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          department: user?.department || 'N/A',
          reportId: obj.reportId,
          createdAt: obj.createdAt.toISOString(),
          reportDate: report?.createdAt.toISOString().split('T')[0] || 'N/A'
        };
      })
    );

    res.status(200).json({
      data: formattedObjectIds,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching Object ID registry:', error);
    res.status(500).json({ message: 'Failed to fetch Object ID registry' });
  }
};

// Get Object ID usage history
export const getObjectIdHistory = async (req: any, res: any) => {
  try {
    const { objectId } = req.params;

    const history = await prisma.objectIDIndex.findMany({
      where: {
        objectId: {
          equals: objectId
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get related data for each history entry
    const formattedHistory = await Promise.all(
      history.map(async (entry) => {
        const [user, project, report] = await Promise.all([
          prisma.user.findUnique({
            where: { id: entry.userId },
            select: {
              username: true,
              firstName: true,
              lastName: true,
              department: true
            }
          }),
          prisma.project.findUnique({
            where: { id: entry.projectId },
            select: {
              name: true,
              is_active: true
            }
          }),
          prisma.report.findUnique({
            where: { id: entry.reportId },
            select: {
              createdAt: true
            }
          })
        ]);

        return {
          id: entry.id,
          objectId: entry.objectId,
          projectId: entry.projectId,
          projectName: project?.name || 'Unknown Project',
          userId: entry.userId,
          userName: user?.username || 'Unknown User',
          userFullName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          department: user?.department || 'N/A',
          reportId: entry.reportId,
          createdAt: entry.createdAt.toISOString(),
          reportDate: report?.createdAt.toISOString().split('T')[0] || 'N/A'
        };
      })
    );

    res.status(200).json({
      objectId,
      usageCount: formattedHistory.length,
      history: formattedHistory
    });
  } catch (error: any) {
    console.error('Error fetching Object ID history:', error);
    res.status(500).json({ message: 'Failed to fetch Object ID history' });
  }
};

// Check if Object ID exists (for real-time validation)
export const checkObjectIdExists = async (req: any, res: any) => {
  try {
    const { objectId, excludeReportId, excludeProjectId } = req.query;

    let whereClause: any = {
      objectId: {
        equals: objectId
      }
    };

    if (excludeReportId) {
      whereClause.reportId = {
        not: excludeReportId
      };
    }

    if (excludeProjectId) {
      whereClause.projectId = {
        not: excludeProjectId
      };
    }

    const existingEntries = await prisma.objectIDIndex.findMany({
      where: whereClause,
      take: 5 // Limit to first 5 results for performance
    });

    // Get related data for duplicates
    const duplicates = await Promise.all(
      existingEntries.map(async (entry) => {
        const [user, project, report] = await Promise.all([
          prisma.user.findUnique({
            where: { id: entry.userId },
            select: {
              username: true,
              firstName: true,
              lastName: true
            }
          }),
          prisma.project.findUnique({
            where: { id: entry.projectId },
            select: {
              name: true
            }
          }),
          prisma.report.findUnique({
            where: { id: entry.reportId },
            select: {
              createdAt: true
            }
          })
        ]);

        return {
          id: entry.id,
          reportId: entry.reportId,
          projectName: project?.name || 'Unknown Project',
          userName: user?.username || 'Unknown User',
          userFullName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          createdAt: entry.createdAt.toISOString(),
          reportDate: report?.createdAt.toISOString().split('T')[0] || 'N/A'
        };
      })
    );

    res.status(200).json({
      objectId,
      exists: existingEntries.length > 0,
      duplicateCount: existingEntries.length,
      recentUsage: duplicates
    });
  } catch (error: any) {
    console.error('Error checking Object ID:', error);
    res.status(500).json({ message: 'Failed to check Object ID' });
  }
};

// Get Object ID statistics
export const getObjectIdStats = async (req: any, res: any) => {
  try {
    const { projectId, userId } = req.query;

    let whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;
    if (userId) whereClause.userId = userId;

    const [
      totalObjectIds,
      uniqueObjectIds,
      projectCounts,
      userCounts,
      recentActivity
    ] = await Promise.all([
      prisma.objectIDIndex.count({ where: whereClause }),
      prisma.objectIDIndex.findMany({
        where: whereClause,
        select: { objectId: true },
        distinct: ['objectId']
      }),
      prisma.objectIDIndex.groupBy({
        by: ['projectId'],
        where: whereClause,
        _count: { objectId: true }
      }),
      prisma.objectIDIndex.groupBy({
        by: ['userId'],
        where: whereClause,
        _count: { objectId: true }
      }),
      prisma.objectIDIndex.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    const formattedProjectCounts = await Promise.all(
      projectCounts.map(async (count) => {
        const project = await prisma.project.findUnique({
          where: { id: count.projectId },
          select: { name: true }
        });
        return {
          projectId: count.projectId,
          projectName: project?.name || 'Unknown Project',
          count: count._count.objectId
        };
      })
    );

    const formattedUserCounts = await Promise.all(
      userCounts.map(async (count) => {
        const user = await prisma.user.findUnique({
          where: { id: count.userId },
          select: { username: true, firstName: true, lastName: true }
        });
        return {
          userId: count.userId,
          userName: user?.username || 'Unknown User',
          userFullName: `${user?.firstName} ${user?.lastName}`,
          count: count._count.objectId
        };
      })
    );

    const formattedRecentActivity = await Promise.all(
      recentActivity.map(async (entry) => {
        const [user, project] = await Promise.all([
          prisma.user.findUnique({
            where: { id: entry.userId },
            select: { username: true, firstName: true, lastName: true }
          }),
          prisma.project.findUnique({
            where: { id: entry.projectId },
            select: { name: true }
          })
        ]);

        return {
          id: entry.id,
          objectId: entry.objectId,
          projectName: project?.name || 'Unknown Project',
          userName: user?.username || 'Unknown User',
          userFullName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          createdAt: entry.createdAt.toISOString()
        };
      })
    );

    res.status(200).json({
      totalEntries: totalObjectIds,
      uniqueObjectIds: uniqueObjectIds.length,
      projectBreakdown: formattedProjectCounts,
      userBreakdown: formattedUserCounts,
      recentActivity: formattedRecentActivity
    });
  } catch (error: any) {
    console.error('Error fetching Object ID statistics:', error);
    res.status(500).json({ message: 'Failed to fetch Object ID statistics' });
  }
};

// Bulk upload Object ID entries from CSV (admin only)
export const bulkUploadObjectIds = async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const lines = csvData.split('\n').filter((line: string) => line.trim());

    if (lines.length < 2) {
      return res.status(400).json({ message: 'CSV file must contain at least a header row and one data row' });
    }

    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    const requiredHeaders = ['objectid', 'projectid', 'userid', 'reportid'];

    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        message: `Missing required columns: ${missingHeaders.join(', ')}`
      });
    }

    const objectIdIndex = headers.indexOf('objectid');
    const projectIdIndex = headers.indexOf('projectid');
    const userIdIndex = headers.indexOf('userid');
    const reportIdIndex = headers.indexOf('reportid');

    const entries = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v: string) => v.trim());

      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Incorrect number of columns`);
        continue;
      }

      const objectId = values[objectIdIndex];
      const projectId = values[projectIdIndex];
      const userId = values[userIdIndex];
      const reportId = values[reportIdIndex];

      if (!objectId || !projectId || !userId || !reportId) {
        errors.push(`Row ${i + 1}: Missing required values`);
        continue;
      }

      // Validate that project, user, and report exist
      try {
        const [project, user, report] = await Promise.all([
          prisma.project.findUnique({ where: { id: projectId } }),
          prisma.user.findUnique({ where: { id: userId } }),
          prisma.report.findUnique({ where: { id: reportId } })
        ]);

        if (!project) {
          errors.push(`Row ${i + 1}: Project ID ${projectId} not found`);
          continue;
        }
        if (!user) {
          errors.push(`Row ${i + 1}: User ID ${userId} not found`);
          continue;
        }
        if (!report) {
          errors.push(`Row ${i + 1}: Report ID ${reportId} not found`);
          continue;
        }

        entries.push({
          objectId,
          projectId,
          userId,
          reportId
        });
      } catch (validationError: any) {
        errors.push(`Row ${i + 1}: Validation error - ${validationError.message}`);
      }
    }

    if (entries.length === 0) {
      return res.status(400).json({
        message: 'No valid entries found to upload',
        errors
      });
    }

    // Insert entries individually to handle duplicates properly
    let uploadedCount = 0;
    const duplicateErrors: string[] = [];

    for (const entry of entries) {
      try {
        await prisma.objectIDIndex.create({
          data: entry
        });
        uploadedCount++;
      } catch (error: any) {
        // Check if it's a duplicate key error
        if (error.code === 'P2002') {
          duplicateErrors.push(`Object ID ${entry.objectId} already exists`);
        } else {
          errors.push(`Failed to create entry for Object ID ${entry.objectId}: ${error.message}`);
        }
      }
    }

    // Add duplicate warnings to errors if any
    if (duplicateErrors.length > 0) {
      errors.push(...duplicateErrors);
    }

    res.status(200).json({
      message: `Successfully uploaded ${uploadedCount} Object ID entries`,
      uploadedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error bulk uploading Object IDs:', error);
    res.status(500).json({ message: 'Failed to bulk upload Object IDs' });
  }
};

// Bulk delete Object ID entries (admin only)
export const bulkDeleteObjectIds = async (req: any, res: any) => {
  try {
    const { objectIds } = req.body;

    if (!Array.isArray(objectIds) || objectIds.length === 0) {
      return res.status(400).json({ message: 'Object IDs array is required' });
    }

    const deletedCount = await prisma.objectIDIndex.deleteMany({
      where: {
        objectId: {
          in: objectIds
        }
      }
    });

    res.status(200).json({
      message: `Successfully deleted ${deletedCount.count} Object ID entries`,
      deletedCount: deletedCount.count
    });
  } catch (error: any) {
    console.error('Error bulk deleting Object IDs:', error);
    res.status(500).json({ message: 'Failed to bulk delete Object IDs' });
  }
};
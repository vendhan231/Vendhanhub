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
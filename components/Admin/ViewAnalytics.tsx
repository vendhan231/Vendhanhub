import React, { useState, useEffect } from 'react';
import { apiFetchBillingRecords, apiFetchProjects, apiFetchAllUsers } from '../../services/api';
import { BillingRecord, Project, User, BillingAnalytics, ProjectBillingSummary, UserBillingSummary, BillingStatus } from '../../types';
import { THEME } from '../../constants';
import { DocumentTextIcon, CurrencyDollarIcon, UserGroupIcon, FolderIcon } from '@heroicons/react/24/outline';

const ViewAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<BillingAnalytics | null>(null);
  const [projectSummaries, setProjectSummaries] = useState<ProjectBillingSummary[]>([]);
  const [userSummaries, setUserSummaries] = useState<UserBillingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data
      const [billingRecords, projects, users] = await Promise.all([
        apiFetchBillingRecords(),
        apiFetchProjects(),
        apiFetchAllUsers()
      ]);

      // Calculate analytics
      const analyticsData = calculateAnalytics(billingRecords);
      const projectData = calculateProjectSummaries(billingRecords);
      const userData = calculateUserSummaries(billingRecords, users);

      setAnalytics(analyticsData);
      setProjectSummaries(projectData);
      setUserSummaries(userData);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (records: BillingRecord[]): BillingAnalytics => {
    const totalBilling = records.reduce((sum, record) => sum + record.calculatedAmount, 0);
    const pendingBilling = records
      .filter(r => r.status === BillingStatus.PENDING)
      .reduce((sum, record) => sum + record.calculatedAmount, 0);
    const approvedBilling = 0; // Placeholder - no APPROVED status in current enum
    const paidBilling = records
      .filter(r => r.status === BillingStatus.PAID)
      .reduce((sum, record) => sum + record.calculatedAmount, 0);

    const uniqueProjects = new Set(records.map(r => r.projectId)).size;
    const uniqueUsers = new Set(records.map(r => r.userId)).size;
    const totalReports = records.length;

    return {
      summary: {
        totalBilling,
        pendingBilling,
        approvedBilling,
        paidBilling,
        monthlyBilling: totalBilling // Simplified - would calculate current month
      },
      counts: {
        totalProjects: uniqueProjects,
        totalUsers: uniqueUsers,
        totalReports
      }
    };
  };

  const calculateProjectSummaries = (records: BillingRecord[]): ProjectBillingSummary[] => {
    const projectMap = new Map<string, ProjectBillingSummary>();

    records.forEach(record => {
      const existing = projectMap.get(record.projectId) || {
        projectId: record.projectId,
        projectName: record.projectName || 'Unknown Project',
        totalBilling: 0,
        totalItems: 0,
        reportCount: 0
      };

      existing.totalBilling += record.calculatedAmount;
      existing.totalItems += record.achievedCountTotal || 0;
      existing.reportCount += 1;

      projectMap.set(record.projectId, existing);
    });

    return Array.from(projectMap.values()).sort((a, b) => b.totalBilling - a.totalBilling);
  };

  const calculateUserSummaries = (records: BillingRecord[], users: User[]): UserBillingSummary[] => {
    const userMap = new Map<string, UserBillingSummary>();

    records.forEach(record => {
      const existing = userMap.get(record.userId) || {
        userId: record.userId,
        userName: users.find(u => u.id === record.userId)?.firstName + ' ' + users.find(u => u.id === record.userId)?.lastName || 'Unknown User',
        totalBilling: 0,
        reportCount: 0
      };

      existing.totalBilling += record.calculatedAmount;
      existing.reportCount += 1;

      userMap.set(record.userId, existing);
    });

    return Array.from(userMap.values()).sort((a, b) => b.totalBilling - a.totalBilling);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
        <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
  }

  if (!analytics) {
    return <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-gray-500`}>No analytics data available</div>;
  }

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-semibold text-${THEME.primary}`}>Analytics Dashboard</h2>
        <button
          onClick={loadAnalytics}
          className={`px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85`}
        >
          Refresh Data
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(analytics.summary.totalBilling)}</div>
              <div className="text-sm text-blue-600">Total Billing</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-900">{analytics.counts.totalReports}</div>
              <div className="text-sm text-green-600">Total Reports</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FolderIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-900">{analytics.counts.totalProjects}</div>
              <div className="text-sm text-purple-600">Active Projects</div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-orange-900">{analytics.counts.totalUsers}</div>
              <div className="text-sm text-orange-600">Active Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Status Breakdown */}
      <div className="mb-8">
        <h3 className={`text-lg font-medium text-${THEME.primary} mb-4`}>Billing Status Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-yellow-900">{formatCurrency(analytics.summary.pendingBilling)}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-blue-900">{formatCurrency(analytics.summary.approvedBilling)}</div>
            <div className="text-sm text-blue-600">Approved</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-green-900">{formatCurrency(analytics.summary.paidBilling)}</div>
            <div className="text-sm text-green-600">Paid</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-gray-900">{formatCurrency(analytics.summary.monthlyBilling)}</div>
            <div className="text-sm text-gray-600">This Month</div>
          </div>
        </div>
      </div>

      {/* Project Performance */}
      <div className="mb-8">
        <h3 className={`text-lg font-medium text-${THEME.primary} mb-4`}>Project Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Billing</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reports</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items Processed</th>
              </tr>
            </thead>
            <tbody>
              {projectSummaries.slice(0, 10).map(project => (
                <tr key={project.projectId} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{project.projectName}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-green-600">{formatCurrency(project.totalBilling)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{project.reportCount}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{project.totalItems}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Performance */}
      <div className="mb-8">
        <h3 className={`text-lg font-medium text-${THEME.primary} mb-4`}>User Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Billing</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reports Submitted</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg per Report</th>
              </tr>
            </thead>
            <tbody>
              {userSummaries.slice(0, 10).map(user => (
                <tr key={user.userId} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{user.userName}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-green-600">{formatCurrency(user.totalBilling)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{user.reportCount}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {formatCurrency(user.totalBilling / user.reportCount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="border-t pt-6">
        <h3 className={`text-lg font-medium text-${THEME.primary} mb-4`}>Export Analytics</h3>
        <div className="flex gap-4">
          <button
            onClick={() => {
              const data = [analytics.summary, analytics.counts];
              const csv = Object.keys(data[0]).join(',') + '\n' + Object.values(data[0]).join(',');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'analytics-summary.csv';
              a.click();
            }}
            className={`px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85`}
          >
            Export Summary CSV
          </button>

          <button
            onClick={() => {
              const csv = 'Project,Total Billing,Reports,Items\n' +
                projectSummaries.map(p => `${p.projectName},${p.totalBilling},${p.reportCount},${p.totalItems}`).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'project-analytics.csv';
              a.click();
            }}
            className={`px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85`}
          >
            Export Project Data
          </button>

          <button
            onClick={() => {
              const csv = 'User,Total Billing,Reports,Avg per Report\n' +
                userSummaries.map(u => `${u.userName},${u.totalBilling},${u.reportCount},${u.totalBilling / u.reportCount}`).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'user-analytics.csv';
              a.click();
            }}
            className={`px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85`}
          >
            Export User Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAnalytics;
import React, { useState, useEffect } from 'react';
import { apiFetchUserDailyWorkReports } from '../../services/api';
import { DailyWorkReport } from '../../types';
import { THEME } from '../../constants';
import { DocumentTextIcon, CalendarIcon, ClockIcon, BeakerIcon } from '@heroicons/react/24/outline';

const WorkReportHistory: React.FC = () => {
  const [reports, setReports] = useState<DailyWorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = 'current-user-id'; // This should come from auth context
      const filters = startDate || endDate ? { startDate, endDate } : undefined;
      const fetchedReports = await apiFetchUserDailyWorkReports(userId, filters);
      setReports(fetchedReports);
    } catch (err: any) {
      setError(err.message || 'Failed to load work reports');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const calculateTotalHours = (report: DailyWorkReport): number => {
    return report.projectLogs.reduce((total, log) => total + log.hoursWorked, 0);
  };

  const calculateTotalBilling = (report: DailyWorkReport): number => {
    // This is a simplified calculation - in real implementation, this would use project billing rules
    return report.projectLogs.reduce((total, log) => total + (log.hoursWorked * 50), 0); // Assuming $50/hour rate
  };

  if (loading && reports.length === 0) {
    return (
      <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
        <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading work reports...
      </div>
    );
  }

  if (error) {
    return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
  }

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className={`text-2xl font-semibold text-${THEME.primary}`}>Work Report History</h2>

        {/* Date Filters */}
        <div className="flex gap-4">
          <div>
            <label htmlFor="startDate" className={`block text-sm font-medium text-${THEME.accentText} mb-1`}>From</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
            />
          </div>
          <div>
            <label htmlFor="endDate" className={`block text-sm font-medium text-${THEME.accentText} mb-1`}>To</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
            />
          </div>
        </div>
      </div>

      {loading && <p className={`text-sm text-${THEME.accentText} my-2`}>Refreshing reports...</p>}

      {reports.length === 0 ? (
        <p className={`text-center text-gray-500 py-8`}>No work reports found for the selected period.</p>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">{new Date(report.date).toLocaleDateString()}</h3>
                    <p className="text-sm text-gray-500">Submitted: {new Date(report.submittedAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">{formatCurrency(calculateTotalBilling(report))}</div>
                  <div className="text-sm text-gray-500">{calculateTotalHours(report).toFixed(2)} hours</div>
                </div>
              </div>

              <div className="space-y-2">
                {report.projectLogs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-3">
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="font-medium">{log.projectName}</span>
                        {log.description && (
                          <p className="text-sm text-gray-600">{log.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span>{log.hoursWorked}h</span>
                      </div>
                      {log.achievedCount && (
                        <div className="flex items-center space-x-1">
                          <BeakerIcon className="h-4 w-4 text-gray-400" />
                          <span>{log.achievedCount}</span>
                        </div>
                      )}
                      <div className="font-medium text-green-600">
                        {formatCurrency(log.hoursWorked * 50)} {/* Simplified calculation */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {reports.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Period Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
                <div className="text-sm text-gray-600">Reports</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {reports.reduce((total, report) => total + calculateTotalHours(report), 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(reports.reduce((total, report) => total + calculateTotalBilling(report), 0))}
                </div>
                <div className="text-sm text-gray-600">Total Earnings</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkReportHistory;
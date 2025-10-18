import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetchUserDailyWorkReports } from '../../services/api';
import { DailyWorkReport } from '../../types';
import { THEME } from '../../constants';
import { CalendarIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const WorkReportHistory: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<DailyWorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<DailyWorkReport | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const reportDate = new Date(report.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && reportDate < start) return false;
      if (end && reportDate > end) return false;

      const matchesSearch = searchTerm
        ? report.projectLogs.some(log =>
            log.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.id.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : true;

      const matchesProject = projectFilter && projectFilter !== 'all'
        ? report.projectLogs.some(log => log.projectName === projectFilter)
        : true;

      return matchesSearch && matchesProject;
    });
  }, [reports, startDate, endDate, searchTerm, projectFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user) throw new Error('User not authenticated');
      const fetchedReports = await apiFetchUserDailyWorkReports(user.id);
      setReports(fetchedReports);
    } catch (err: any) {
      setError(err.message || 'Failed to load work reports');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const calculateTotalBilling = (report: DailyWorkReport): number => {
    return report.projectLogs.reduce((total, log) => total + (log.billing?.calculatedPay || 0), 0);
  };

  const getTotalObjects = (report: DailyWorkReport): number => {
    return report.projectLogs.length;
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
      <div className="space-y-4 mb-6">
        <h2 className={`text-2xl font-semibold text-${THEME.primary}`}>Work Report History</h2>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by project, description, or Object ID..."
          />
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {Array.from(new Set(reports.flatMap(r => r.projectLogs.map(l => l.projectName)))).filter(Boolean).map(project => (
                <SelectItem key={project} value={project}>{project}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {loading && <p className={`text-sm text-${THEME.accentText} my-2`}>Refreshing reports...</p>}

      {filteredReports.length === 0 ? (
        <p className={`text-center text-gray-500 py-8`}>No work reports found for the selected filters.</p>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all">
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
                  <div className="text-sm text-gray-500">{getTotalObjects(report)} objects</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                <EyeIcon className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredReports.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Filtered Results Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{filteredReports.length}</div>
                <div className="text-sm text-gray-600">Reports</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredReports.reduce((total, report) => total + getTotalObjects(report), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Objects</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(filteredReports.reduce((total, report) => total + calculateTotalBilling(report), 0))}
                </div>
                <div className="text-sm text-gray-600">Total Earnings</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Report Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Report Details - {selectedReport ? new Date(selectedReport.date).toLocaleDateString() : ''}</DialogTitle>
            <DialogDescription>
              Detailed view of all objects and fields for the selected report.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4">
            {selectedReport?.projectLogs.map(log => (
              <div key={log.id} className="border rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-2">{log.projectName} - {log.id}</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {Object.entries(log.customFields || {}).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium text-gray-500">{key}: </span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                  <div>
                    <span className="font-medium text-gray-500">Billing Amount: </span>
                    <span className="font-semibold text-green-600">{formatCurrency(log.billing?.calculatedPay)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkReportHistory;

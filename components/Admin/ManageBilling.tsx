import React, { useState, useEffect } from 'react';
import { apiFetchBillingRecords, apiUpdateBillingRecord, apiDeleteBillingRecord } from '../../services/api';
import { BillingRecord, BillingStatus } from '../../types';
import { THEME } from '../../constants';
import { CurrencyDollarIcon, CheckCircleIcon, ClockIcon, XCircleIcon, PencilSquareIcon, TrashIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const ManageBilling: React.FC = () => {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BillingStatus | ''>('');
  const [userFilter, setUserFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Edit modal state
  const [editingRecord, setEditingRecord] = useState<BillingRecord | null>(null);
  const [editStatus, setEditStatus] = useState<BillingStatus>(BillingStatus.PENDING);
  const [editAmount, setEditAmount] = useState('');

  useEffect(() => {
    loadBillingRecords();
  }, [statusFilter, userFilter, projectFilter]);

  const loadBillingRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (userFilter) filters.userId = userFilter;
      if (projectFilter) filters.projectId = projectFilter;

      const records = await apiFetchBillingRecords(filters);
      setBillingRecords(records);
    } catch (err: any) {
      setError(err.message || 'Failed to load billing records');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusIcon = (status: BillingStatus) => {
    switch (status) {
      case BillingStatus.PAID:
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case BillingStatus.PENDING:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case BillingStatus.OVERDUE:
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: BillingStatus) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case BillingStatus.PAID:
        return `${baseClasses} bg-green-100 text-green-800`;
      case BillingStatus.PENDING:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case BillingStatus.OVERDUE:
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleEditRecord = (record: BillingRecord) => {
    setEditingRecord(record);
    setEditStatus(record.status);
    setEditAmount(record.billingAmount.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    try {
      const updates: Partial<BillingRecord> = {
        status: editStatus,
        billingAmount: parseFloat(editAmount),
        calculatedAmount: parseFloat(editAmount)
      };

      await apiUpdateBillingRecord(editingRecord.id, updates);
      setBillingRecords(records =>
        records.map(r => r.id === editingRecord.id ? { ...r, ...updates } : r)
      );
      setEditingRecord(null);
      alert('Billing record updated successfully');
    } catch (err: any) {
      alert(`Error updating record: ${err.message}`);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to delete this billing record? This action cannot be undone.')) {
      return;
    }

    try {
      await apiDeleteBillingRecord(recordId);
      setBillingRecords(records => records.filter(r => r.id !== recordId));
      alert('Billing record deleted successfully');
    } catch (err: any) {
      alert(`Error deleting record: ${err.message}`);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Project', 'Client', 'Amount', 'Status', 'Items', 'Count'];
    const csvData = billingRecords.map(record => [
      record.date,
      record.userId, // In real app, this would be user name
      record.projectName,
      record.clientName,
      record.billingAmount,
      record.status,
      record.totalItems,
      record.totalCount
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'all-billing-records.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateTotals = () => {
    const totalAmount = billingRecords.reduce((sum, record) => sum + record.billingAmount, 0);
    const pendingAmount = billingRecords
      .filter(record => record.status === BillingStatus.PENDING)
      .reduce((sum, record) => sum + record.billingAmount, 0);
    const paidAmount = billingRecords
      .filter(record => record.status === BillingStatus.PAID)
      .reduce((sum, record) => sum + record.billingAmount, 0);
    const overdueAmount = billingRecords
      .filter(record => record.status === BillingStatus.OVERDUE)
      .reduce((sum, record) => sum + record.billingAmount, 0);

    return { totalAmount, pendingAmount, paidAmount, overdueAmount };
  };

  if (loading && billingRecords.length === 0) {
    return (
      <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
        <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading billing records...
      </div>
    );
  }

  if (error) {
    return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
  }

  const { totalAmount, pendingAmount, paidAmount, overdueAmount } = calculateTotals();

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className={`text-2xl font-semibold text-${THEME.primary}`}>Manage Billing Records</h2>

        <button
          onClick={exportToCSV}
          className={`inline-flex items-center px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary}`}
        >
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalAmount)}</div>
              <div className="text-sm text-blue-600">Total Billed</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">{formatCurrency(pendingAmount)}</div>
              <div className="text-sm text-yellow-600">Pending</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(paidAmount)}</div>
              <div className="text-sm text-green-600">Paid</div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-red-900">{formatCurrency(overdueAmount)}</div>
              <div className="text-sm text-red-600">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className={`block text-sm font-medium text-${THEME.accentText} mb-1`}>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BillingStatus | '')}
            className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
          >
            <option value="">All Status</option>
            <option value={BillingStatus.PENDING}>Pending</option>
            <option value={BillingStatus.PAID}>Paid</option>
            <option value={BillingStatus.OVERDUE}>Overdue</option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium text-${THEME.accentText} mb-1`}>User ID</label>
          <input
            type="text"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="Filter by user ID"
            className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium text-${THEME.accentText} mb-1`}>Project ID</label>
          <input
            type="text"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            placeholder="Filter by project ID"
            className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
          />
        </div>
      </div>

      {loading && <p className={`text-sm text-${THEME.accentText} my-2`}>Refreshing records...</p>}

      {billingRecords.length === 0 ? (
        <p className={`text-center text-gray-500 py-8`}>No billing records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {billingRecords.map(record => (
                <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.userId}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.projectName}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-green-600">
                    {formatCurrency(record.billingAmount)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(record.status)}
                      <span className={getStatusBadge(record.status)}>
                        {record.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    <div className="text-xs text-gray-500">
                      {record.totalItems} items, {record.totalCount} count
                    </div>
                    {record.isCountBased && (
                      <div className="text-xs text-gray-500">
                        Rate: {formatCurrency(record.rate)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 text-right">
                    <button
                      onClick={() => handleEditRecord(record)}
                      className={`p-1.5 text-gray-500 hover:text-${THEME.secondary} transition-colors mr-2`}
                      title="Edit Record"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className={`p-1.5 text-gray-500 hover:text-red-600 transition-colors`}
                      title="Delete Record"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto">
          <div className={`bg-white p-6 rounded-lg shadow-xl w-full max-w-md my-8`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold text-${THEME.primary}`}>Edit Billing Record</h3>
              <button onClick={() => setEditingRecord(null)} className={`text-gray-400 hover:text-gray-600`}>
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium text-${THEME.accentText} mb-1`}>Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as BillingStatus)}
                  className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
                >
                  <option value={BillingStatus.PENDING}>Pending</option>
                  <option value={BillingStatus.PAID}>Paid</option>
                  <option value={BillingStatus.OVERDUE}>Overdue</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium text-${THEME.accentText} mb-1`}>Amount ($)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBilling;

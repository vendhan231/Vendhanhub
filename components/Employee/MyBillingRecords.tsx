import React, { useState, useEffect } from 'react';
import { apiFetchBillingRecords } from '../../services/api';
import { BillingRecord, BillingStatus } from '../../types';
import { THEME } from '../../constants';
import { CurrencyDollarIcon, CheckCircleIcon, ClockIcon, XCircleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const MyBillingRecords: React.FC = () => {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BillingStatus | ''>('');

  useEffect(() => {
    loadBillingRecords();
  }, [statusFilter]);

  const loadBillingRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = 'current-user-id'; // This should come from auth context
      const filters = statusFilter ? { status: statusFilter } : undefined;
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

  const exportToCSV = () => {
    const headers = ['Date', 'Project', 'Client', 'Amount', 'Status', 'Items', 'Count'];
    const csvData = billingRecords.map(record => [
      record.date,
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
    link.setAttribute('download', 'billing-records.csv');
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

    return { totalAmount, pendingAmount, paidAmount };
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

  const { totalAmount, pendingAmount, paidAmount } = calculateTotals();

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className={`text-2xl font-semibold text-${THEME.primary}`}>My Billing Records</h2>

        <div className="flex gap-4">
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

          <button
            onClick={exportToCSV}
            className={`inline-flex items-center px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary}`}
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalAmount)}</div>
              <div className="text-sm text-blue-600">Total Earnings</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">{formatCurrency(pendingAmount)}</div>
              <div className="text-sm text-yellow-600">Pending Payment</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(paidAmount)}</div>
              <div className="text-sm text-green-600">Paid Amount</div>
            </div>
          </div>
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
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {billingRecords.map(record => (
                <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.projectName}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.clientName}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyBillingRecords;

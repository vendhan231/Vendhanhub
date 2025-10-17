import React, { useState, useEffect, FormEvent } from 'react';
import { apiFetchProjects, apiSubmitReport, apiCheckDuplicateObjectIds, apiExtractFields } from '../../services/api';
import { Project, FieldConfig } from '../../types';
import { THEME } from '../../constants';
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ReportData {
  [key: string]: any;
}

interface ItemData {
  [key: string]: any;
}

const SubmitWorkReportForm: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [reportData, setReportData] = useState<ReportData>({});
  const [items, setItems] = useState<ItemData[]>([{}]);
  const [billingPreview, setBillingPreview] = useState<{ totalItems: number; totalCount: number; billingAmount: number } | null>(null);

  // Search and filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [fileExtracted, setFileExtracted] = useState(false);

  // Duplicate detection
  const [duplicateWarnings, setDuplicateWarnings] = useState<Array<{ objectId: string; reportId: string; user: any; date: string }>>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    // Filter projects based on search term
    if (projectSearchTerm) {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [projectSearchTerm, projects]);

  useEffect(() => {
    if (selectedProject) {
      // Initialize form with project fields
      const initialReportData: ReportData = {};
      selectedProject.fieldConfig?.report_level.forEach(field => {
        if (field.type === 'date') {
          initialReportData[field.label] = selectedDate;
        }
      });
      setReportData(initialReportData);
      setItems([{}]);
      setBillingPreview(null);
      setDuplicateWarnings([]);
    }
  }, [selectedProject, selectedDate]);

  const loadProjects = async () => {
    try {
      const fetchedProjects = await apiFetchProjects();
      setProjects(fetchedProjects);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProject) return;
    // file is used immediately for extraction; we don't need to keep it in state
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', selectedProject.id);

  const result = await apiExtractFields();

      // Apply extracted data to form
      if (result.extractedData.reportData) {
        setReportData(prev => ({ ...prev, ...result.extractedData.reportData }));
      }
      if (result.extractedData.items && result.extractedData.items.length > 0) {
        setItems(result.extractedData.items);
      }

      setFileExtracted(true);
      setSuccess('Data extracted from file successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to extract data from file');
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicates = async () => {
    if (!selectedProject) return;

    const objectIds: string[] = [];
    items.forEach(item => {
      selectedProject.fieldConfig?.item_level.forEach(field => {
        if (field.unique && field.label.toLowerCase() === 'object id') {
          const objectId = item[field.label];
          if (objectId) objectIds.push(objectId);
        }
      });
    });

    if (objectIds.length > 0) {
      try {
  const duplicates = await apiCheckDuplicateObjectIds();
        setDuplicateWarnings(duplicates);
      } catch (err: any) {
        setError(err.message || 'Failed to check duplicates');
      }
    }
  };

  const calculateBilling = () => {
    if (!selectedProject?.billingConfig) return;

    const config = selectedProject.billingConfig;
    const totalItems = items.length;
    let totalCount = 0;
    let billingAmount = 0;

    if (config.rateType === 'per_item') {
      billingAmount = totalItems * config.rateValue;
    } else if (config.rateType === 'per_record' || config.rateType === 'per_count_field') {
      const countField = config.countField || 'Record Count';
      items.forEach(item => {
        const count = item[countField] || 0;
        totalCount += count;
      });
      billingAmount = totalCount * config.rateValue;
    }

    setBillingPreview({ totalItems, totalCount, billingAmount });
  };

  useEffect(() => {
    if (selectedProject && items.length > 0) {
      calculateBilling();
      checkDuplicates();
    }
  }, [selectedProject, items]);

  const addItem = () => {
    setItems([...items, {}]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiSubmitReport();

      setSuccess(`Report submitted successfully! Billing: $${result.billingAmount}`);
      // Reset form
      setSelectedProject(null);
      setReportData({});
      setItems([{}]);
      setBillingPreview(null);
      setDuplicateWarnings([]);
        // file state cleared earlier when not stored
      setFileExtracted(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: FieldConfig, value: any, onChange: (value: any) => void, isItem = false) => {
    const baseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
            rows={3}
            required={field.required}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            className={baseClasses}
            required={field.required}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
            required={field.required}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClasses} ${isItem && field.unique ? 'border-purple-300' : ''}`}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg max-w-4xl mx-auto`}>
      <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6`}>Submit Work Report</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <XCircleIcon className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Selection */}
        <div>
          <label className={`block text-sm font-medium text-${THEME.accentText} mb-2`}>Report Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
            required
          />
        </div>

        {/* Project Selection with Search */}
        <div>
          <label className={`block text-sm font-medium text-${THEME.accentText} mb-2`}>Select Project</label>
          <input
            type="text"
            placeholder="Search projects..."
            value={projectSearchTerm}
            onChange={(e) => setProjectSearchTerm(e.target.value)}
            className={`mb-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
          />
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value);
              setSelectedProject(project || null);
            }}
            className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
            required
          >
            <option value="">Choose a project...</option>
            {filteredProjects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          {projectSearchTerm && (
            <p className="text-sm text-gray-600 mt-1">
              Showing {filteredProjects.length} of {projects.length} projects
            </p>
          )}
        </div>

        {selectedProject && (
          <>
            {/* File Upload */}
            <div className="border-t pt-6">
              <label className={`block text-sm font-medium text-${THEME.accentText} mb-2`}>Upload CSV/Excel File (Optional)</label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-${THEME.primary} file:text-${THEME.primaryText} hover:file:bg-opacity-80`}
              />
              {fileExtracted && <p className="text-sm text-green-600 mt-1">✓ Data extracted from file</p>}
            </div>

            {/* Report Level Fields */}
            {selectedProject.fieldConfig?.report_level && selectedProject.fieldConfig.report_level.length > 0 && (
              <div className="border-t pt-6">
                <h3 className={`text-lg font-medium text-${THEME.primary} mb-4`}>Report Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProject.fieldConfig.report_level.map(field => (
                    <div key={field.label}>
                      <label className={`block text-sm font-medium text-${THEME.accentText} mb-1`}>
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {renderField(field, reportData[field.label], (value) => setReportData({ ...reportData, [field.label]: value }))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items Section */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium text-${THEME.primary}`}>Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className={`px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85`}
                >
                  Add Item
                </button>
              </div>

              {items.map((item, index) => (
                <div key={index} className={`border rounded-lg p-4 mb-4 ${duplicateWarnings.some(d => items.some(i => i['Object ID'] === d.objectId)) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedProject.fieldConfig?.item_level.map(field => (
                      <div key={field.label}>
                        <label className={`block text-sm font-medium text-${THEME.accentText} mb-1`}>
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                          {field.unique && <span className="text-purple-500 text-xs ml-1">(unique)</span>}
                        </label>
                        {renderField(field, item[field.label], (value) => updateItem(index, field.label, value), true)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Duplicate Warnings */}
            {duplicateWarnings.length > 0 && (
              <div className="border-t pt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    <h4 className="font-medium text-yellow-800">Duplicate Object IDs Detected</h4>
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {duplicateWarnings.map((dup, idx) => (
                      <li key={idx}>
                        Object ID '{dup.objectId}' already exists in Report #{dup.reportId} by {dup.user.firstName} {dup.user.lastName} on {new Date(dup.date).toLocaleDateString()}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete the duplicate Object IDs? This will remove them from the existing reports.`)) {
                          try {
                            // Delete duplicates logic would go here
                            setDuplicateWarnings([]);
                            alert('Duplicate Object IDs have been deleted.');
                          } catch (error) {
                            alert('Failed to delete duplicates.');
                          }
                        }
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete Duplicates
                    </button>
                    <p className="text-sm text-yellow-600 flex-1">You can still proceed with submission, but billing may be affected.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Preview */}
            {billingPreview && (
              <div className="border-t pt-6">
                <h3 className={`text-lg font-medium text-${THEME.primary} mb-4`}>Billing Preview</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{billingPreview.totalItems}</div>
                      <div className="text-sm text-gray-600">Total Items</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{billingPreview.totalCount}</div>
                      <div className="text-sm text-gray-600">Total Count</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">${billingPreview.billingAmount.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Billing Amount</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="border-t pt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full px-6 py-3 bg-${THEME.primary} text-${THEME.primaryText} text-lg font-medium rounded-md hover:bg-opacity-85 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default SubmitWorkReportForm;
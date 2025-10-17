
import React, { useState, useEffect, FormEvent } from 'react';
import { apiFetchProjects, apiAddProject, apiUpdateProject, apiDeleteProject } from '../../services/api';
import { Project, FieldConfig, BillingConfig } from '../../types';
import { THEME } from '../../constants';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, XMarkIcon, BeakerIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const ManageProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project> | null>(null); 
  
  const [projectName, setProjectName] = useState('');
  const [fieldConfig, setFieldConfig] = useState<{
    report_level: FieldConfig[];
    item_level: FieldConfig[];
  }>({
    report_level: [],
    item_level: []
  });
  const [billingConfig, setBillingConfig] = useState<BillingConfig>({
    rateType: 'custom_formula',
    rateValue: 0,
    countField: '',
    formula: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Legacy fields for backward compatibility (kept for potential future use)
  // const [billingType, setBillingType] = useState<ProjectBillingType>('hourly');
  // const [ratePerHour, setRatePerHour] = useState<number | ''>('');
  // const [countMetricLabel, setCountMetricLabel] = useState('');
  // const [countDivisor, setCountDivisor] = useState<number | ''>(1);
  // const [countMultiplier, setCountMultiplier] = useState<number | ''>('');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = projects.filter(project =>
      project.name.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredProjects(filteredData);
  }, [searchTerm, projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProjects = await apiFetchProjects();
      setProjects(fetchedProjects);
      // setFilteredProjects(fetchedProjects); // Handled by useEffect
    } catch (err: any) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const resetFormFields = () => {
    setProjectName('');
    setFieldConfig({
      report_level: [],
      item_level: []
    });
    setBillingConfig({
      rateType: 'custom_formula',
      rateValue: 0,
      countField: '',
      formula: ''
    });
    setFormError(null);
  };

  const openModalForAdd = () => {
    setCurrentProject(null);
    resetFormFields();
    setIsModalOpen(true);
  };

  const openModalForEdit = (project: Project) => {
    setCurrentProject(project);
    setProjectName(project.name);
    setFieldConfig(project.fieldConfig || { report_level: [], item_level: [] });
    setBillingConfig(project.billingConfig || { rateType: 'custom_formula', rateValue: 0, formula: '' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProject(null);
    resetFormFields();
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!projectName.trim()) {
      setFormError('Project name is required.');
      return;
    }

    // Validate field configurations
    if (fieldConfig.report_level.length === 0 && fieldConfig.item_level.length === 0) {
      setFormError('At least one field must be configured for report or item level.');
      return;
    }

    // Validate billing configuration
    if (billingConfig.rateType === 'custom_formula') {
      if (!billingConfig.formula?.trim()) {
        setFormError('Formula is required for custom formula billing.');
        return;
      }
      // Check if formula contains at least one numeric field
      const numericFields = fieldConfig.item_level.filter(f => f.type === 'number' && f.includeInBilling);
      const hasNumericFieldInFormula = numericFields.some(field =>
        billingConfig.formula!.includes(field.label)
      );
      if (!hasNumericFieldInFormula) {
        setFormError('Formula must include at least one numeric field marked for billing.');
        return;
      }
    } else if (billingConfig.rateValue <= 0) {
      setFormError('Rate value must be greater than 0.');
      return;
    }

    if (billingConfig.rateType === 'per_count_field' && !billingConfig.countField) {
      setFormError('Count field is required for per count field billing.');
      return;
    }

    const projectData = {
      name: projectName.trim(),
      fieldConfig,
      billingConfig,
    };

    try {
      if (currentProject && currentProject.id) {
        const updatedProject = await apiUpdateProject(currentProject.id, projectData);
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
      } else {
        const newProject = await apiAddProject(projectData);
        setProjects([...projects, newProject]);
      }
      closeModal();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save project.');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await apiDeleteProject(projectId);
        setProjects(projects.filter(p => p.id !== projectId));
        alert('Project deleted successfully.');
      } catch (err: any) {
         setError(err.message || 'Failed to delete project.');
         alert(`Error: ${err.message || 'Failed to delete project.'}`);
      }
    }
  };
  
  const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return 'N/A';
    return `₹${amount.toFixed(2)}`;
  };
  
  const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const selectBaseClasses = `mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;


  if (loading && projects.length === 0) {
    return (
      <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
        <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading projects...
      </div>
    );
  }

  if (error) {
    return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
  }

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className={`text-2xl font-semibold text-${THEME.primary}`}>Manage Projects</h2>
         <input
            type="text"
            placeholder="Filter by project name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputBaseClasses} sm:w-64 w-full`}
        />
        <button
          onClick={openModalForAdd}
          className={`inline-flex items-center px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} w-full sm:w-auto justify-center`}
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Add New Project
        </button>
      </div>
      
      {loading && <p className={`text-sm text-${THEME.accentText} my-2`}>Refreshing project list...</p>}
      {filteredProjects.length === 0 ? (
        <p className={`text-center text-gray-500 py-8`}>{searchTerm ? 'No projects match your search.' : 'No projects found. Add one to get started.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project Name</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Billing Config</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => (
                <tr key={project.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-700">{project.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                      <DocumentTextIcon className="h-3 w-3 mr-1"/>
                      Data Entry
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {project.billingConfig ? (
                      <div>
                        <div>Rate: {formatCurrency(project.billingConfig.rateValue)}</div>
                        <div>Type: {project.billingConfig.rateType.replace('_', ' ')}</div>
                        {project.billingConfig.countField && (
                          <div>Field: {project.billingConfig.countField}</div>
                        )}
                      </div>
                    ) : (
                      'Legacy billing'
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 text-right">
                    <button 
                      onClick={() => openModalForEdit(project)}
                      className={`p-1.5 text-gray-500 hover:text-${THEME.secondary} transition-colors mr-2`}
                      title="Edit Project"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(project.id)}
                      className={`p-1.5 text-gray-500 hover:text-red-600 transition-colors`}
                      title="Delete Project"
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

      {/* Modal for Add/Edit Project */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto">
          <div className={`bg-white p-6 rounded-lg shadow-xl w-full max-w-lg my-8`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold text-${THEME.primary}`}>
                {currentProject?.id ? 'Edit Project' : 'Add New Project'}
              </h3>
              <button onClick={closeModal} className={`text-gray-400 hover:text-gray-600`}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label htmlFor="modalProjectName" className={`block text-sm font-medium text-${THEME.accentText}`}>Project Name</label>
                <input
                  type="text"
                  id="modalProjectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className={inputBaseClasses}
                  required
                />
              </div>

              {/* Field Configuration */}
              <div className="border-t pt-4">
                <h4 className={`text-md font-medium text-${THEME.primary} mb-3`}>Field Configuration</h4>

                {/* Report Level Fields */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium text-${THEME.accentText} mb-2`}>Report Level Fields</label>
                  <div className="space-y-2">
                    {fieldConfig.report_level.map((field, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{field.label}</span>
                          <span className="text-xs text-gray-500">({field.type})</span>
                          {field.required && <span className="text-xs text-red-500">*</span>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newLabel = prompt('New field label:', field.label);
                              if (newLabel && newLabel !== field.label) {
                                setFieldConfig(prev => ({
                                  ...prev,
                                  report_level: prev.report_level.map((f, i) => i === index ? { ...f, label: newLabel } : f)
                                }));
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFieldConfig(prev => ({
                                ...prev,
                                report_level: prev.report_level.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const label = prompt('Field label:');
                        const type = prompt('Field type (text/number/date/select/textarea):', 'text');
                        if (label && type) {
                          setFieldConfig(prev => ({
                            ...prev,
                            report_level: [...prev.report_level, { label, type: type as any, required: false }]
                          }));
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Report Field
                    </button>
                  </div>
                </div>

                {/* Item Level Fields */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium text-${THEME.accentText} mb-2`}>Item Level Fields</label>
                  <div className="space-y-2">
                    {/* Default Object_ID field */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded border">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Object_ID</span>
                        <span className="text-xs text-gray-500">(text)</span>
                        <span className="text-xs text-red-500">*</span>
                        <span className="text-xs text-purple-500">unique</span>
                      </div>
                      <span className="text-xs text-gray-500">Default field</span>
                    </div>

                    {fieldConfig.item_level.map((field, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{field.label}</span>
                          <span className="text-xs text-gray-500">({field.type})</span>
                          {field.unique && <span className="text-xs text-purple-500">unique</span>}
                          {field.required && <span className="text-xs text-red-500">*</span>}
                          {field.includeInBilling && <span className="text-xs text-green-600">billing</span>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              checked={field.required || false}
                              onChange={(e) => {
                                setFieldConfig(prev => ({
                                  ...prev,
                                  item_level: prev.item_level.map((f, i) => i === index ? { ...f, required: e.target.checked } : f)
                                }));
                              }}
                              className="h-3 w-3"
                            />
                            <span className="text-xs">Required</span>
                          </label>
                          {field.type === 'number' && (
                            <label className="flex items-center space-x-1">
                              <input
                                type="checkbox"
                                checked={field.includeInBilling || false}
                                onChange={(e) => {
                                  setFieldConfig(prev => ({
                                    ...prev,
                                    item_level: prev.item_level.map((f, i) => i === index ? { ...f, includeInBilling: e.target.checked } : f)
                                  }));
                                }}
                                className="h-3 w-3"
                              />
                              <span className="text-xs">Billing</span>
                            </label>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const newLabel = prompt('New field label:', field.label);
                              if (newLabel && newLabel !== field.label) {
                                setFieldConfig(prev => ({
                                  ...prev,
                                  item_level: prev.item_level.map((f, i) => i === index ? { ...f, label: newLabel } : f)
                                }));
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFieldConfig(prev => ({
                                ...prev,
                                item_level: prev.item_level.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const label = prompt('Field label:');
                        const type = prompt('Field type (text/number/date/select/textarea):', 'text');
                        if (label && type) {
                          setFieldConfig(prev => ({
                            ...prev,
                            item_level: [...prev.item_level, { label, type: type as any, unique: false, required: false, includeInBilling: false }]
                          }));
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Item Field
                    </button>
                  </div>
                </div>
              </div>

              {/* Billing Configuration */}
              <div className="border-t pt-4">
                <h4 className={`text-md font-medium text-${THEME.primary} mb-3`}>Billing Configuration</h4>

                <div className="mb-4">
                  <label htmlFor="rateType" className={`block text-sm font-medium text-${THEME.accentText} mb-2`}>Rate Type</label>
                  <select
                    id="rateType"
                    value={billingConfig.rateType}
                    onChange={(e) => setBillingConfig(prev => ({ ...prev, rateType: e.target.value as any }))}
                    className={selectBaseClasses}
                  >
                    <option value="custom_formula">Custom Formula</option>
                    <option value="per_item">Per Item</option>
                    <option value="per_record">Per Record</option>
                    <option value="per_count_field">Per Count Field</option>
                  </select>
                </div>

                {billingConfig.rateType === 'custom_formula' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="formula" className={`block text-sm font-medium text-${THEME.accentText} mb-2`}>Billing Formula</label>
                      <textarea
                        id="formula"
                        value={billingConfig.formula || ''}
                        onChange={(e) => setBillingConfig(prev => ({ ...prev, formula: e.target.value }))}
                        className={`${inputBaseClasses} h-20`}
                        placeholder="e.g., (CharacterCount / 1000) * Rate"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Tip: Use field labels in your billing formula (e.g., "(CharacterCount / 1000) * 4.85")
                      </p>
                    </div>

                    {/* Field Reference Helper */}
                    <div className="bg-blue-50 p-3 rounded">
                      <h5 className="text-sm font-medium text-blue-800 mb-2">Available Fields for Formula:</h5>
                      <div className="flex flex-wrap gap-2">
                        {fieldConfig.item_level.filter(f => f.type === 'number' && f.includeInBilling).map((field, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {field.label}
                          </span>
                        ))}
                      </div>
                      {fieldConfig.item_level.filter(f => f.type === 'number' && f.includeInBilling).length === 0 && (
                        <p className="text-xs text-blue-600">No numeric fields marked for billing yet.</p>
                      )}
                    </div>

                    {/* Formula Test Section */}
                    <div className="border-t pt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Test Formula</h5>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        {fieldConfig.item_level.filter(f => f.type === 'number' && f.includeInBilling).map((field, index) => (
                          <div key={index}>
                            <label className={`block text-xs font-medium text-${THEME.accentText} mb-1`}>{field.label}</label>
                            <input
                              type="number"
                              step="0.01"
                              className={inputBaseClasses}
                              placeholder={`Enter ${field.label} value`}
                              onChange={(e) => {
                                // Store test values in component state
                                setFieldConfig(prev => ({
                                  ...prev,
                                  item_level: prev.item_level.map((f, i) => i === index ? { ...f, testValue: parseFloat(e.target.value) || 0 } : f)
                                }));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!billingConfig.formula) {
                            alert('Please enter a formula first.');
                            return;
                          }

                          try {
                            const numericFields = fieldConfig.item_level.filter(f => f.type === 'number' && f.includeInBilling);
                            let formula = billingConfig.formula;

                            // Replace field names with test values
                            numericFields.forEach(field => {
                              const testValue = (field as any).testValue || 0;
                              const regex = new RegExp(`\\b${field.label}\\b`, 'g');
                              formula = formula.replace(regex, testValue.toString());
                            });

                            // Evaluate the formula safely
                            const result = Function('"use strict"; return (' + formula + ')')();
                            alert(`Formula result: ₹${result.toFixed(2)}`);
                          } catch (error) {
                            alert(`Formula error: ${(error as Error).message}`);
                          }
                        }}
                        className={`px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition`}
                      >
                        <BeakerIcon className="h-4 w-4 inline mr-1" />
                        Test Formula
                      </button>
                    </div>
                  </div>
                )}

                {(billingConfig.rateType === 'per_item' || billingConfig.rateType === 'per_record') && (
                  <div>
                    <label htmlFor="rateValue" className={`block text-sm font-medium text-${THEME.accentText}`}>Rate Value (₹)</label>
                    <input
                      type="number"
                      id="rateValue"
                      value={billingConfig.rateValue}
                      onChange={(e) => setBillingConfig(prev => ({ ...prev, rateValue: parseFloat(e.target.value) || 0 }))}
                      min="0.01"
                      step="0.01"
                      className={inputBaseClasses}
                      required
                    />
                  </div>
                )}

                {billingConfig.rateType === 'per_count_field' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="rateValue" className={`block text-sm font-medium text-${THEME.accentText}`}>Rate Value (₹)</label>
                      <input
                        type="number"
                        id="rateValue"
                        value={billingConfig.rateValue}
                        onChange={(e) => setBillingConfig(prev => ({ ...prev, rateValue: parseFloat(e.target.value) || 0 }))}
                        min="0.01"
                        step="0.01"
                        className={inputBaseClasses}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="countField" className={`block text-sm font-medium text-${THEME.accentText}`}>Count Field Name</label>
                      <input
                        type="text"
                        id="countField"
                        value={billingConfig.countField || ''}
                        onChange={(e) => setBillingConfig(prev => ({ ...prev, countField: e.target.value }))}
                        className={inputBaseClasses}
                        placeholder="e.g., Record Count"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {formError && (
                <div className="mt-2 p-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md">
                  {formError}
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none`}
                >
                  {currentProject?.id ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProjects;

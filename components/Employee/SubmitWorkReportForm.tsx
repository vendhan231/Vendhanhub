import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiSubmitDailyWorkReport, apiFetchProjects } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import PasteDataModal from "./PasteDataModal";
import * as XLSX from 'xlsx';
import {
  FileText,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Upload,
  Trash2,
  Eye,
  Clipboard
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  billingType?: 'hourly' | 'count_based';
  ratePerHour?: number;
  countMetricLabel?: string;
  countDivisor?: number;
  countMultiplier?: number;
  item_fields?: ProjectField[];
  billing_formula?: string;
}

interface ProjectField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea';
  required: boolean;
}

interface ObjectData {
  id: string;
  objectId: string;
  customFields: Record<string, any>;
}

interface WorkReportData {
  projectId: string;
  date: string;
  hoursWorked?: number;
  description: string;
  objects: ObjectData[];
  fileData?: any[];
}

interface ProcessedFileData {
  fileName: string;
  objectIds: string[];
  extractedFields: Record<string, any>[];
  duplicates: string[];
  totalRecords: number;
}

const SubmitWorkReportForm = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [calculationResult, setCalculationResult] = useState<number>(0);

  // Form data
  const [formData, setFormData] = useState<WorkReportData>({
    projectId: "",
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 0,
    description: "",
    objects: [{ id: `item-${Date.now()}`, objectId: "", customFields: {} }],
  });

  // File processing
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedFileData[]>([]);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    show: boolean;
    duplicates: string[];
    action?: 'delete' | 'keep';
  }>({ show: false, duplicates: [] });

  // Paste functionality
  const [pasteModalOpen, setPasteModalOpen] = useState(false);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'V':
            if (event.shiftKey) {
              event.preventDefault();
              setPasteModalOpen(true);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadProjects = async () => {
    try {
      const fetchedProjects = await apiFetchProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      toast.error("Failed to load projects");
    }
  };

  const addObject = () => {
    setFormData(prev => ({
      ...prev,
      objects: [
        ...prev.objects,
        { id: `item-${Date.now()}`, objectId: "", customFields: {} }
      ]
    }));
  };

  const removeObject = (id: string) => {
    if (formData.objects.length <= 1) {
      toast.error("You must have at least one object.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      objects: prev.objects.filter(obj => obj.id !== id)
    }));
  };

  const handleObjectChange = async (id: string, field: 'objectId' | 'customFields', value: any, customFieldLabel?: string) => {
    setFormData(prev => ({
      ...prev,
      objects: prev.objects.map(obj => {
        if (obj.id === id) {
          if (field === 'objectId') {
            return { ...obj, objectId: value };
          }
          if (field === 'customFields' && customFieldLabel) {
            return {
              ...obj,
              customFields: {
                ...obj.customFields,
                [customFieldLabel]: value
              }
            };
          }
        }
        return obj;
      })
    }));

    // Real-time duplicate detection
    if (field === 'objectId' && value.trim()) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/object-ids/check/${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          // Show duplicate warning if found
          if (data.exists) {
            toast.warning(`Object ID "${value}" already exists in ${data.duplicateCount} other reports`);
          }
        }
      } catch (error) {
        console.error('Error checking Object ID:', error);
      }
    }
  };

  // Handle project selection
  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
    setFormData(prev => ({
      ...prev,
      projectId,
      objects: [{ id: `item-${Date.now()}`, objectId: "", customFields: {} }],
      hoursWorked: project?.billingType === 'hourly' ? prev.hoursWorked : undefined,
    }));
    // Clear processed data when project changes
    setProcessedData([]);
    setUploadedFiles([]);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    processFiles(files);
  };

  // Process uploaded files
  const processFiles = async (files: File[]) => {
    if (!selectedProject) {
      toast.error("Please select a project first");
      return;
    }

    setProcessingFiles(true);

    try {
      const processedResults: ProcessedFileData[] = [];

      for (const file of files) {
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Process Excel files
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });

          // Get all sheet names
          const sheetNames = workbook.SheetNames;

          // Find sheet that matches the selected project name
          const projectSheet = sheetNames.find(sheetName =>
            sheetName.toLowerCase() === selectedProject.name.toLowerCase()
          );

          if (!projectSheet) {
            toast.warning(`No sheet named "${selectedProject.name}" found in ${file.name}. Available sheets: ${sheetNames.join(', ')}`);
            continue;
          }

          const worksheet = workbook.Sheets[projectSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length === 0) continue;

          // Assume first row is headers
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];

          // Map rows to objects
          const extractedFields = rows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });

          // Extract Object_IDs
          const objectIds = extractedFields
            .map(row => row.Object_ID || row.objectId || row.ID || row.id)
            .filter(id => id);

          // Find duplicates within this sheet
          const duplicates = objectIds.filter((id, index) => objectIds.indexOf(id) !== index);

          const processedData: ProcessedFileData = {
            fileName: `${file.name} - ${projectSheet}`,
            objectIds,
            extractedFields,
            duplicates: [...new Set(duplicates)],
            totalRecords: extractedFields.length,
          };

          processedResults.push(processedData);
        } else if (file.name.endsWith('.csv')) {
          // Process CSV files using PapaParse
          const text = await file.text();
          const Papa = await import('papaparse');
          const parsed = Papa.default.parse(text, { header: true, skipEmptyLines: true });

          const extractedFields = parsed.data as any[];
          const objectIds = extractedFields
            .map(row => row.Object_ID || row.objectId || row.ID || row.id)
            .filter(id => id);

          const duplicates = objectIds.filter((id, index) => objectIds.indexOf(id) !== index);

          const processedData: ProcessedFileData = {
            fileName: file.name,
            objectIds,
            extractedFields,
            duplicates: [...new Set(duplicates)],
            totalRecords: extractedFields.length,
          };

          processedResults.push(processedData);
        } else {
          toast.warning(`Unsupported file type: ${file.name}`);
          continue;
        }
      }

      setProcessedData(processedResults);

      // Load extracted data into form objects
      if (processedResults.length > 0) {
        const allExtractedData = processedResults.flatMap(p => p.extractedFields);
        loadExtractedDataIntoForm(allExtractedData);
      }

      // Check for duplicates across all files
      const allObjectIds = processedResults.flatMap(p => p.objectIds);
      const duplicateIds = allObjectIds.filter((id, index) => allObjectIds.indexOf(id) !== index);

      if (duplicateIds.length > 0) {
        setDuplicateWarning({
          show: true,
          duplicates: [...new Set(duplicateIds)],
        });
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast.error("Failed to process files");
    } finally {
      setProcessingFiles(false);
    }
  };

  // Load extracted data into form objects
  const loadExtractedDataIntoForm = (extractedData: any[]) => {
    const newObjects = extractedData.map((row, index) => {
      const customFields: Record<string, any> = {};

      // Map Excel columns to project fields
      if (selectedProject?.item_fields) {
        selectedProject.item_fields.forEach(field => {
          // Try different possible column names
          const possibleKeys = [
            field.label,
            field.label.replace(/\s+/g, '_'),
            field.label.replace(/\s+/g, ''),
            field.label.toLowerCase(),
            field.label.toLowerCase().replace(/\s+/g, '_'),
            field.label.toLowerCase().replace(/\s+/g, ''),
            // Also try common variations
            'CharacterCount', 'RecordCount', 'Count', 'Qty', 'Quantity'
          ];

          let value = '';
          for (const key of possibleKeys) {
            if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
              value = row[key];
              break;
            }
          }

          // Handle date fields
          if (field.type === 'date' && value) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                value = date.toISOString().split('T')[0];
              }
            } catch (e) {
              // Keep original value if parsing fails
            }
          }

          customFields[field.label] = value;
        });
      }

      // Extract Object_ID
      const objectId = row.Object_ID || row.objectId || row.ID || row.id || `AUTO_${index + 1}`;

      return {
        id: `extracted-${Date.now()}-${index}`,
        objectId: objectId.toString(),
        customFields
      };
    });

    setFormData(prev => ({
      ...prev,
      objects: [...prev.objects, ...newObjects]
    }));

    toast.success(`Loaded ${newObjects.length} records from file`);

    // Trigger billing calculation after loading data
    setTimeout(() => {
      calculateBilling();
    }, 100);
  };

  // Handle duplicate resolution
  const handleDuplicateResolution = (action: 'delete' | 'keep') => {
    if (action === 'delete') {
      // Remove all duplicate Object_IDs from processedData
      setProcessedData(prev => prev.map(file => ({
        ...file,
        extractedFields: file.extractedFields.filter((row, idx, arr) =>
          arr.findIndex(r => r.Object_ID === row.Object_ID) === idx
        ),
        objectIds: Array.from(new Set(file.objectIds.filter((id, idx, arr) => arr.indexOf(id) === idx)))
      })));
      setDuplicateWarning({ show: false, duplicates: [] });
      toast.success('Duplicates deleted');
    } else {
      setDuplicateWarning(prev => ({ ...prev, action }));
      toast.success('Duplicates kept');
    }
  };

  // Calculate billing
  const calculateBilling = () => {
    if (!selectedProject || !selectedProject.billing_formula || !selectedProject.item_fields) {
      console.log('Missing project data for billing calculation:', { selectedProject, billing_formula: selectedProject?.billing_formula, item_fields: selectedProject?.item_fields });
      return;
    }

    try {
      let totalBilling = 0;
      let validObjects = 0;

      formData.objects.forEach((object, index) => {
        if (!object.objectId) return; // Skip objects without ID

        let formula = selectedProject.billing_formula!;
        let hasValidData = false;

        selectedProject.item_fields!.forEach(field => {
          if (field.type === 'number') {
            const value = object.customFields[field.label] || 0;
            if (value !== 0 && value !== '' && value !== null && value !== undefined) {
              hasValidData = true;
            }
            formula = formula.replace(new RegExp(field.label, 'g'), value.toString());
          } else if (field.type === 'date') {
            // For date fields, you might want to calculate days, age, etc.
            // For now, we'll skip them in calculations unless specifically needed
            const dateValue = object.customFields[field.label];
            if (dateValue) {
              // Example: convert to days since epoch or extract day/month
              // This is just a placeholder - actual implementation depends on requirements
              formula = formula.replace(new RegExp(field.label, 'g'), '0');
            }
          }
          // Text and textarea fields are not used in numerical calculations
        });

        if (hasValidData) {
          try {
            const result = new Function('return ' + formula)();
            const numericResult = Number(result);
            if (!isNaN(numericResult)) {
              totalBilling += numericResult;
              validObjects++;
            }
          } catch (formulaError) {
            console.error(`Error calculating formula for object ${index}:`, formulaError);
          }
        }
      });

      setCalculationResult(totalBilling);
      if (totalBilling > 0) {
        toast.success(`Calculated Total: ₹${totalBilling.toFixed(2)} (${validObjects} objects)`);
      } else {
        toast.warning("No valid billing data found. Check if numeric fields are populated.");
      }
    } catch (error) {
      console.error('Billing calculation error:', error);
      toast.error("Invalid formula or missing values in one of the objects");
      setCalculationResult(0);
    }
  };

  // Handle paste insert
  const handlePasteInsert = (objects: any[]) => {
    setFormData(prev => ({
      ...prev,
      objects: [
        ...prev.objects,
        ...objects.map(obj => ({
          id: `item-${Date.now()}-${Math.random()}`,
          objectId: obj.objectId,
          customFields: obj.customFields
        }))
      ]
    }));
    calculateBilling(); // Trigger billing calculation
  };

  // Submit work report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject) {
      toast.error("Please select a project");
      return;
    }

    setSubmitting(true);

    try {
      if (!user) throw new Error("User not authenticated");

      // Prepare projectLogs from form objects (includes both manual and extracted data)
      const projectLogs = formData.objects
        .filter(obj => obj.objectId) // only include objects with an ID
        .map(obj => {
          return {
            id: obj.objectId,
            projectId: formData.projectId,
            projectName: selectedProject?.name || '',
            hoursWorked: formData.hoursWorked || 0,
            description: formData.description || '',
            achievedCount: obj.customFields[selectedProject.countMetricLabel || ''] || undefined,
            customFields: obj.customFields,
          };
        });

      const reportData = {
        userId: user.id,
        date: formData.date,
        projectLogs,
      };

      await apiSubmitDailyWorkReport(reportData);
      toast.success("Work report submitted successfully!");

      // Reset form
      setFormData({
        projectId: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
        objects: [{ id: `item-${Date.now()}`, objectId: "", customFields: {} }],
      });
      setSelectedProject(null);
      setUploadedFiles([]);
      setProcessedData([]);
      setCalculationResult(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(errorMessage || "Failed to submit work report");
    } finally {
      setSubmitting(false);
    }
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setProcessedData(prev => prev.filter((_, i) => i !== index));
    // Remove extracted objects from form
    setFormData(prev => ({
      ...prev,
      objects: prev.objects.filter(obj => !obj.id.includes(`extracted-${index}`))
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="glass-card shadow-soft">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            Submit Work Report
          </CardTitle>
          <CardDescription className="text-base">
            Upload files, process data, and submit work reports with automatic billing calculation
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Project *</Label>
              <Select value={formData.projectId} onValueChange={handleProjectSelect}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id} className="font-semibold bg-primary/10 text-primary">
                      {project.name} ({project.billingType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Report Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="h-12"
                required
              />
            </div>

            {/* Dynamic Fields Based on Project */}
            {selectedProject && (
              <div className="space-y-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                {selectedProject.billingType === 'hourly' && (
                  <div className="space-y-2">
                    <Label htmlFor="hoursWorked">Hours Worked *</Label>
                    <Input
                      id="hoursWorked"
                      type="number"
                      value={formData.hoursWorked || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, hoursWorked: Number(e.target.value) }))}
                      placeholder="Enter hours worked"
                      className="h-12"
                      required
                    />
                  </div>
                )}
                <h3 className="text-lg font-semibold text-primary">Project Fields</h3>

                {formData.objects.map((object) => (
                  <div key={object.id} className="space-y-4 p-3 border rounded-md relative">
                    {formData.objects.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeObject(object.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                    {/* Object ID Field */}
                    <div className="space-y-2">
                      <Label htmlFor={`objectId-${object.id}`}>Object ID *</Label>
                      <Input
                        id={`objectId-${object.id}`}
                        value={object.objectId}
                        onChange={(e) => handleObjectChange(object.id, 'objectId', e.target.value)}
                        placeholder="Enter unique object identifier"
                        className="h-12"
                        required
                      />
                    </div>

                    {/* Dynamic Project Fields */}
                    {selectedProject.item_fields?.filter(field => field.label !== 'Object_ID')
                      .map(field => (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={`${field.label}-${object.id}`}>
                            {field.label} {field.required && '*'}
                          </Label>
                          {field.type === 'number' && (
                            <Input
                              id={`${field.label}-${object.id}`}
                              type="number"
                              value={object.customFields[field.label] || ''}
                              onChange={(e) => handleObjectChange(object.id, 'customFields', Number(e.target.value), field.label)}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              className="h-12"
                              required={field.required}
                            />
                          )}
                          {field.type === 'text' && (
                            <Input
                              id={`${field.label}-${object.id}`}
                              value={object.customFields[field.label] || ''}
                              onChange={(e) => handleObjectChange(object.id, 'customFields', e.target.value, field.label)}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              className="h-12"
                              required={field.required}
                            />
                          )}
                          {field.type === 'date' && (
                            <Input
                              id={`${field.label}-${object.id}`}
                              type="date"
                              value={object.customFields[field.label] || ''}
                              onChange={(e) => handleObjectChange(object.id, 'customFields', e.target.value, field.label)}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              className="h-12"
                              required={field.required}
                            />
                          )}
                          {field.type === 'textarea' && (
                            <Textarea
                              id={`${field.label}-${object.id}`}
                              value={object.customFields[field.label] || ''}
                              onChange={(e) => handleObjectChange(object.id, 'customFields', e.target.value, field.label)}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              rows={3}
                              required={field.required}
                            />
                          )}
                        </div>
                      ))}
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={addObject}>
                    Add Another Object
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPasteModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Clipboard className="w-4 h-4" />
                    Paste Data (Ctrl+Shift+V)
                  </Button>
                </div>

                {/* Billing Calculator */}
                <div className="pt-4 border-t border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">Billing Calculator</Label>
                    <Button
                      type="button"
                      onClick={calculateBilling}
                      className="btn-modern bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculate
                    </Button>
                  </div>

                  {calculationResult > 0 && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">₹</span>
                        <span className="text-2xl font-bold text-primary">
                          {calculationResult.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* File Upload Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Upload Files</Label>

              <div className="border-2 border-dashed border-primary/30 rounded-lg p-6">
                <input
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium">Click to upload files</p>
                    <p className="text-sm text-muted-foreground">
                      CSV, Excel, or JSON files supported
                    </p>
                  </div>
                </label>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Uploaded Files</Label>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-medium">{file.name}</span>
                        {processingFiles && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Processed Data Preview */}
              {processedData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Extracted Data from File</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {showPreview ? 'Hide' : 'Preview'}
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => {
                          const extractedObjects = formData.objects.filter(obj => obj.id.startsWith('extracted-'));
                          if (extractedObjects.length === 0) {
                            toast.error("No extracted data to submit");
                            return;
                          }
                          handleSubmit({ preventDefault: () => {} } as any);
                        }}
                        disabled={submitting}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit Extracted Data
                      </Button>
                    </div>
                  </div>

                  {showPreview && (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {processedData.map((data, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{data.fileName}</h4>
                            <span className="text-sm text-muted-foreground">
                              {data.totalRecords} records loaded
                            </span>
                          </div>

                          {data.duplicates.length > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                              <span className="text-sm text-destructive">
                                Duplicates found: {data.duplicates.join(', ')}
                              </span>
                            </div>
                          )}

                          <div className="text-sm text-muted-foreground">
                            Object IDs: {data.objectIds.slice(0, 5).join(', ')}
                            {data.objectIds.length > 5 && ` +${data.objectIds.length - 5} more`}
                          </div>

                          {/* Show first few extracted records */}
                          {data.extractedFields.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-2">Sample Records:</p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {data.extractedFields.slice(0, 3).map((record, idx) => (
                                  <div key={idx} className="text-xs bg-muted p-2 rounded">
                                    {Object.entries(record).slice(0, 4).map(([key, value]) => (
                                      <span key={key} className="mr-2">
                                        <strong>{key}:</strong> {String(value).substring(0, 20)}
                                      </span>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional notes or comments..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                className="flex-1 h-12 text-base font-semibold btn-modern bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={submitting || !selectedProject}
              >
                {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Submit Work Report
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-12 px-6"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>

              {formData.objects.length > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 px-6"
                  onClick={() => {
                    const pastedObjects = formData.objects.filter(obj => obj.objectId);
                    if (pastedObjects.length === 0) {
                      toast.error("No pasted data to commit");
                      return;
                    }
                    // Auto-submit the pasted data
                    handleSubmit({ preventDefault: () => {} } as any);
                  }}
                  disabled={submitting || !selectedProject}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Commit Pasted Data
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Duplicate Warning Dialog */}
      {duplicateWarning.show && (
        <Dialog open={duplicateWarning.show} onOpenChange={() => setDuplicateWarning({ show: false, duplicates: [] })}>
          <DialogContent className="glass-card shadow-strong">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Duplicate Object IDs Detected
              </DialogTitle>
              <DialogDescription>
                The following Object IDs appear multiple times in your uploaded files:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="font-mono text-sm text-destructive">
                  {duplicateWarning.duplicates.join(', ')}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleDuplicateResolution('delete')}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Duplicates
                </Button>
                <Button
                  onClick={() => handleDuplicateResolution('keep')}
                  variant="outline"
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Keep All
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Paste Data Modal */}
      {selectedProject && (
        <PasteDataModal
          open={pasteModalOpen}
          onOpenChange={setPasteModalOpen}
          projectFields={selectedProject.item_fields || []}
          onInsert={handlePasteInsert}
          projectId={selectedProject.id}
        />
      )}
    </div>
  );
};

export default SubmitWorkReportForm;

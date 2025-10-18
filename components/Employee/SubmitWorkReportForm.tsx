import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileText,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Upload,
  Trash2,
  Eye
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  billingType: 'hourly' | 'count_based';
  ratePerHour?: number;
  countMetricLabel?: string;
  countDivisor?: number;
  countMultiplier?: number;
  item_fields: ProjectField[];
  billing_formula: string;
}

interface ProjectField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea';
  required: boolean;
}

interface WorkReportData {
  projectId: string;
  date: string;
  hoursWorked?: number;
  description: string;
  objectId: string;
  customFields: Record<string, any>;
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
    objectId: "",
    customFields: {},
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

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
  // setLoading(true); (removed)
      // Mock data for now - replace with API call
      const mockProjects: Project[] = [
        {
          id: "1",
          name: "Content Writing Project",
          billingType: "count_based",
          countMetricLabel: "WordCount",
          countDivisor: 1000,
          countMultiplier: 4.85,
          item_fields: [
            { id: "1", label: "Object_ID", type: "text", required: true },
            { id: "2", label: "CharacterCount", type: "number", required: true },
            { id: "3", label: "Description", type: "textarea", required: false },
          ],
          billing_formula: "CharacterCount/1000*4.85",
        },
        {
          id: "2",
          name: "Data Entry Project",
          billingType: "count_based",
          countMetricLabel: "RecordCount",
          countDivisor: 1,
          countMultiplier: 1.25,
          item_fields: [
            { id: "1", label: "Object_ID", type: "text", required: true },
            { id: "2", label: "RecordCount", type: "number", required: true },
            { id: "3", label: "Notes", type: "textarea", required: false },
          ],
          billing_formula: "RecordCount*1.25",
        },
      ];
      setProjects(mockProjects);
    } catch (error) {
      toast.error("Failed to load projects");
    } finally {
      // setLoading(false); (removed)
    }
  };

  // Handle project selection
  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
    setFormData(prev => ({
      ...prev,
      projectId,
      customFields: {},
      hoursWorked: project?.billingType === 'hourly' ? prev.hoursWorked : undefined,
    }));
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    processFiles(files);
  };

  // Process uploaded files
  const processFiles = async (files: File[]) => {
    setProcessingFiles(true);

    try {
      const processedResults: ProcessedFileData[] = [];

      for (const file of files) {
        // Mock file processing - replace with actual parsing logic
        const mockProcessedData: ProcessedFileData = {
          fileName: file.name,
          objectIds: ["OBJ001", "OBJ002", "OBJ003", "OBJ001"], // Mock data with duplicate
          extractedFields: [
            { Object_ID: "OBJ001", CharacterCount: 1500, Description: "Sample content 1" },
            { Object_ID: "OBJ002", CharacterCount: 2300, Description: "Sample content 2" },
            { Object_ID: "OBJ003", CharacterCount: 1800, Description: "Sample content 3" },
            { Object_ID: "OBJ001", CharacterCount: 1500, Description: "Duplicate content" },
          ],
          duplicates: ["OBJ001"],
          totalRecords: 4,
        };

        processedResults.push(mockProcessedData);
      }

      setProcessedData(processedResults);

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
      toast.error("Failed to process files");
    } finally {
      setProcessingFiles(false);
    }
  };

  // Handle duplicate resolution
  const handleDuplicateResolution = (action: 'delete' | 'keep') => {
    setDuplicateWarning(prev => ({ ...prev, action }));
    toast.success(`Duplicates ${action === 'delete' ? 'marked for deletion' : 'kept'}`);
  };

  // Calculate billing
  const calculateBilling = () => {
    if (!selectedProject) return;

    try {
      let formula = selectedProject.billing_formula;
      const testValues: Record<string, number> = {};

      // Replace field names in formula with values
      selectedProject.item_fields.forEach(field => {
        if (field.type === 'number') {
          const value = formData.customFields[field.label] || 0;
          testValues[field.label] = Number(value);
          formula = formula.replace(new RegExp(field.label, 'g'), value.toString());
        }
      });

      // Use Function constructor for safety
      const result = new Function('return ' + formula)();
      setCalculationResult(Number(result) || 0);
      toast.success(`Calculated: ₹${Number(result).toFixed(2)}`);
    } catch (error) {
      toast.error("Invalid formula or missing values");
      setCalculationResult(0);
    }
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
      // Mock submission - replace with API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success("Work report submitted successfully!");

      // Reset form
      setFormData({
        projectId: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
        objectId: "",
        customFields: {},
      });
      setSelectedProject(null);
      setUploadedFiles([]);
      setProcessedData([]);
      setCalculationResult(0);

    } catch (error) {
      toast.error("Failed to submit work report");
    } finally {
      setSubmitting(false);
    }
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setProcessedData(prev => prev.filter((_, i) => i !== index));
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
                    <SelectItem key={project.id} value={project.id}>
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
                <h3 className="text-lg font-semibold text-primary">Project Fields</h3>

                {/* Object ID Field */}
                <div className="space-y-2">
                  <Label htmlFor="objectId">Object ID *</Label>
                  <Input
                    id="objectId"
                    value={formData.objectId}
                    onChange={(e) => setFormData(prev => ({ ...prev, objectId: e.target.value }))}
                    placeholder="Enter unique object identifier"
                    className="h-12"
                    required
                  />
                </div>

                {/* Dynamic Project Fields */}
                {selectedProject.item_fields
                  .filter(field => field.label !== 'Object_ID')
                  .map(field => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.label}>
                        {field.label} {field.required && '*'}
                      </Label>
                      {field.type === 'number' && (
                        <Input
                          id={field.label}
                          type="number"
                          value={formData.customFields[field.label] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            customFields: {
                              ...prev.customFields,
                              [field.label]: Number(e.target.value)
                            }
                          }))}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="h-12"
                          required={field.required}
                        />
                      )}
                      {field.type === 'text' && (
                        <Input
                          id={field.label}
                          value={formData.customFields[field.label] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            customFields: {
                              ...prev.customFields,
                              [field.label]: e.target.value
                            }
                          }))}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="h-12"
                          required={field.required}
                        />
                      )}
                      {field.type === 'textarea' && (
                        <Textarea
                          id={field.label}
                          value={formData.customFields[field.label] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            customFields: {
                              ...prev.customFields,
                              [field.label]: e.target.value
                            }
                          }))}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          rows={3}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}

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
                    <Label className="text-base font-semibold">Processed Data</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showPreview ? 'Hide' : 'Preview'}
                    </Button>
                  </div>

                  {showPreview && (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {processedData.map((data, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{data.fileName}</h4>
                            <span className="text-sm text-muted-foreground">
                              {data.totalRecords} records
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
    </div>
  );
};

export default SubmitWorkReportForm;
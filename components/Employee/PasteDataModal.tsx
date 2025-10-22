import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Papa from 'papaparse';
import {
  Clipboard,
  CheckCircle,
  X,
  FileText,
  ChevronRight,
  Undo,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as api from '@/services/api';

interface ProjectField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea';
  required: boolean;
}

interface PasteDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectFields: ProjectField[];
  onInsert: (objects: any[]) => void;
  projectId: string; // Needed for duplicate checks
}

interface ParsedRow {
  [key: string]: any;
}

interface FieldMapping {
  header: string;
  columnIndex: number;
  mappedField: string; // Mapped to ProjectField label
  ignore: boolean;
}

interface ValidationResult {
  totalRows: number;
  valid: number;
  warnings: number;
  errors: number;
  duplicateSummary: { objectId: string; count: number }[];
}

const PasteDataModal: React.FC<PasteDataModalProps> = ({
  open,
  onOpenChange,
  projectFields,
  onInsert,
  projectId,
}) => {
  const [pastedData, setPastedData] = useState('');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [hasHeaders, setHasHeaders] = useState(true);
  const [skipEmptyRows, setSkipEmptyRows] = useState(true);
  const [activeTab, setActiveTab] = useState('data');
  const [validationResults, setValidationResults] = useState<ValidationResult>({
    totalRows: 0,
    valid: 0,
    warnings: 0,
    errors: 0,
    duplicateSummary: [],
  });
  const [pasteHistory, setPasteHistory] = useState<string[]>([]);

  const resetState = useCallback(() => {
    setPastedData('');
    setParsedHeaders([]);
    setParsedRows([]);
    setFieldMappings([]);
    setActiveTab('data');
    setValidationResults({ totalRows: 0, valid: 0, warnings: 0, errors: 0, duplicateSummary: [] });
  }, []);

  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open, resetState]);

  const smartMapField = (header: string): string => {
    const normalizedHeader = header.toLowerCase().replace(/[\s_]/g, '');
    const fieldMap: { [key: string]: string[] } = {
      Object_ID: ['objectid', 'objid', 'object_id'],
      Manifest_ID: ['manifestid', 'manifest_id', 'manifest'],
      Record_Count: ['recordcount', 'record_count', 'count', 'records', 'qty'],
      Status: ['status'],
    };

    for (const field of projectFields) {
      const normalizedFieldLabel = field.label.toLowerCase().replace(/[\s_]/g, '');
      if (normalizedFieldLabel === normalizedHeader) {
        return field.label;
      }
      const aliases = fieldMap[field.label] || [];
      if (aliases.includes(normalizedHeader)) {
        return field.label;
      }
    }
    return '';
  };

  const parseData = () => {
    if (!pastedData.trim()) {
      toast.error('Please paste some data first');
      return;
    }

    Papa.parse(pastedData, {
      header: hasHeaders,
      skipEmptyLines: skipEmptyRows,
      complete: (results: Papa.ParseResult<ParsedRow>) => {
        if (results.errors.length > 0) {
          toast.error('Failed to parse some rows. Please check the format.');
          console.error('Parsing errors:', results.errors);
        }

        const headers = hasHeaders ? results.meta.fields! : (results.data[0] as string[]).map((_: string, i: number) => `Column ${i + 1}`);
        const data = (hasHeaders ? results.data : results.data.slice(1)) as ParsedRow[];

        setParsedHeaders(headers);
        setParsedRows(data);

        const mappings: FieldMapping[] = headers.map((header, index) => {
          const mappedField = smartMapField(header);
          return {
            header,
            columnIndex: index,
            mappedField: mappedField,
            ignore: !mappedField,
          };
        });

        setFieldMappings(mappings);
        setActiveTab('mapping');
        toast.success(`Parsed ${data.length} rows and ${headers.length} columns.`);
      },
      error: (error: Error) => {
        toast.error('Parsing failed: ' + error.message);
      },
    });
  };

  const handleMappingChange = (columnIndex: number, mappedField: string) => {
    setFieldMappings(prev =>
      prev.map(mapping =>
        mapping.columnIndex === columnIndex ? { ...mapping, mappedField, ignore: mappedField === 'ignore' } : mapping
      )
    );
  };

  const validateData = async () => {
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    const objectIds = new Set<string>();
    const duplicatesInPaste = new Set<string>();

    // FR-REPORT-026: Real-time duplicate detection
    const objectIdFieldIndex = fieldMappings.find(m => m.mappedField === 'Object_ID')?.columnIndex;
    const idsToCheck = parsedRows.map(row => row[parsedHeaders[objectIdFieldIndex!]]).filter(Boolean);

    const serverDuplicates = new Set<string>();
    if (idsToCheck.length > 0) {
      try {
        const response = await api.apiCheckObjectIds(projectId, idsToCheck);
        response.duplicates.forEach((id: string) => serverDuplicates.add(id));
      } catch (error) {
        toast.error('Could not verify duplicates against the database.');
      }
    }

    parsedRows.forEach(row => {
      let rowHasError = false;
      fieldMappings.forEach(mapping => {
        if (!mapping.ignore) {
          const value = row[mapping.header];
          const field = projectFields.find(f => f.label === mapping.mappedField);
          if (field?.required && (value === null || value === undefined || value === '')) {
            rowHasError = true;
          }
          if (field?.type === 'number' && value && isNaN(Number(value))) {
            rowHasError = true;
          }
        }
      });

      if (rowHasError) {
        errorCount++;
      } else {
        validCount++;
        // Duplicate checks
        const objectId = objectIdFieldIndex !== undefined ? row[parsedHeaders[objectIdFieldIndex]] : null;
        if (objectId) {
          if (objectIds.has(objectId) || serverDuplicates.has(objectId)) {
            warningCount++;
            duplicatesInPaste.add(objectId);
          }
          objectIds.add(objectId);
        }
      }
    });

    setValidationResults({
      totalRows: parsedRows.length,
      valid: validCount,
      warnings: warningCount,
      errors: errorCount,
      duplicateSummary: Array.from(duplicatesInPaste).map(id => ({ objectId: id, count: idsToCheck.filter(i => i === id).length })),
    });
    setActiveTab('preview');
  };

  const insertData = () => {
    if (validationResults.errors > 0) {
      toast.error('Please fix errors before inserting data.');
      return;
    }

    const finalObjects = parsedRows.map(row => {
      const newObject: { [key: string]: any } = {};
      fieldMappings.forEach(mapping => {
        if (!mapping.ignore && mapping.mappedField) {
          newObject[mapping.mappedField] = row[mapping.header];
        }
      });
      return newObject;
    });

    onInsert(finalObjects);
    setPasteHistory(prev => [pastedData, ...prev.slice(0, 9)]);
    onOpenChange(false);
    toast.success(`Successfully inserted ${finalObjects.length} items.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Clipboard className="w-5 h-5" />Paste Data</DialogTitle>
          <DialogDescription>Paste multiple items from a spreadsheet or CSV. Supports tab, comma, or space-separated values.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="data">1. Paste</TabsTrigger>
            <TabsTrigger value="mapping" disabled={parsedRows.length === 0}>2. Map Fields</TabsTrigger>
            <TabsTrigger value="preview" disabled={fieldMappings.every(m => m.ignore)}>3. Validate & Preview</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4 p-4">
            <Label htmlFor="paste-area">Paste your data below (e.g., from Excel, Google Sheets)</Label>
            <Textarea
              id="paste-area"
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              placeholder={"OBJ001\tMAN001\t100\tNotes1\nOBJ002\tMAN002\t150\tNotes2"}
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center space-x-2"><Checkbox id="headers" checked={hasHeaders} onCheckedChange={(c) => setHasHeaders(!!c)} /><Label htmlFor="headers">First row contains headers</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="empty" checked={skipEmptyRows} onCheckedChange={(c) => setSkipEmptyRows(!!c)} /><Label htmlFor="empty">Skip empty rows</Label></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetState}><X className="w-4 h-4 mr-2" />Clear</Button>
                <Button onClick={parseData}><ChevronRight className="w-4 h-4 mr-2" />Parse Data</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4 p-4 overflow-y-auto">
            <CardDescription>Map the columns from your pasted data to the fields in this project. Unmapped columns will be ignored.</CardDescription>
            <div className="space-y-3">
              {fieldMappings.map((mapping) => (
                <div key={mapping.columnIndex} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <Label className="font-bold">{mapping.header}</Label>
                    <p className="text-xs text-muted-foreground truncate">Sample: {parsedRows.slice(0, 3).map(row => row[mapping.header] || '').join(', ')}</p>
                  </div>
                  <ChevronRight className="text-muted-foreground" />
                  <Select value={mapping.mappedField} onValueChange={(value) => handleMappingChange(mapping.columnIndex, value)}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a field..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">-- Ignore this column --</SelectItem>
                      {projectFields.map(field => (
                        <SelectItem key={field.id} value={field.label}>{field.label} {field.required && '*'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setActiveTab('data')}>Back</Button>
              <Button onClick={validateData}><ChevronRight className="w-4 h-4 mr-2" />Validate & Preview</Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 p-4">
            <Card>
              <CardHeader><CardTitle>Validation Summary</CardTitle></CardHeader>
              <CardContent className="flex justify-around">
                <div className="text-center"><p className="text-2xl font-bold text-green-600">{validationResults.valid}</p><p className="text-sm text-muted-foreground">Valid Rows</p></div>
                <div className="text-center"><p className="text-2xl font-bold text-yellow-600">{validationResults.warnings}</p><p className="text-sm text-muted-foreground">Warnings</p></div>
                <div className="text-center"><p className="text-2xl font-bold text-red-600">{validationResults.errors}</p><p className="text-sm text-muted-foreground">Errors</p></div>
              </CardContent>
            </Card>
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    {fieldMappings.filter(m => !m.ignore).map(mapping => (
                      <th key={mapping.columnIndex} className="p-2 text-left font-semibold">{mapping.mappedField}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, rowIndex) => {
                    let rowHasError = false;
                    let rowHasWarning = false;

                    const objectIdFieldIndex = fieldMappings.find(m => m.mappedField === 'Object_ID')?.columnIndex;
                    const objectId = objectIdFieldIndex !== undefined ? row[parsedHeaders[objectIdFieldIndex]] : null;
                    if (objectId && validationResults.duplicateSummary.some(d => d.objectId === objectId)) {
                      rowHasWarning = true;
                    }

                    fieldMappings.forEach(mapping => {
                      if (!mapping.ignore) {
                        const value = row[mapping.header];
                        const field = projectFields.find(f => f.label === mapping.mappedField);
                        if (field?.required && (value === null || value === undefined || value === '')) {
                          rowHasError = true;
                        }
                        if (field?.type === 'number' && value && isNaN(Number(value))) {
                          rowHasError = true;
                        }
                      }
                    });

                    return (
                      <tr key={rowIndex} className={`border-t ${rowHasError ? 'bg-red-100' : ''} ${rowHasWarning ? 'bg-yellow-100' : ''}`}>
                        {fieldMappings.filter(m => !m.ignore).map(mapping => (
                          <td key={mapping.columnIndex} className="p-2">
                            {row[mapping.header]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setActiveTab('mapping')}>Back</Button>
              <Button onClick={insertData} disabled={validationResults.errors > 0}><CheckCircle className="w-4 h-4 mr-2" />Insert {validationResults.valid} Items</Button>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 p-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Template</CardTitle>
                <CardDescription>Download a CSV template with headers matching this project's fields.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => {
                  const headers = projectFields.map(f => f.label).join(',');
                  const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', `${projectId}_template.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}>
                  <FileText className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Load Example Data</CardTitle>
                <CardDescription>Populate the text area with sample data to see the expected format.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => {
                  const headers = projectFields.map(f => f.label).join('\t');
                  const exampleRow1 = projectFields.map(f => {
                    if (f.label === 'Object_ID') return 'OBJ001';
                    if (f.type === 'number') return '100';
                    return 'Sample Data';
                  }).join('\t');
                  const exampleRow2 = projectFields.map(f => {
                    if (f.label === 'Object_ID') return 'OBJ002';
                    if (f.type === 'number') return '150';
                    return 'More Sample Data';
                  }).join('\t');
                  setPastedData(`${headers}\n${exampleRow1}\n${exampleRow2}`);
                  setActiveTab('data');
                }}>
                  Load Example
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 p-4">
            <CardDescription>Restore a previous paste session.</CardDescription>
            {pasteHistory.length > 0 ? pasteHistory.map((pastPastedData, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <p className="text-sm truncate">{pastPastedData.substring(0, 80)}...</p>
                <Button variant="ghost" size="sm" onClick={() => { setPastedData(pastPastedData); setActiveTab('data'); }}><Undo className="w-4 h-4 mr-2" />Restore</Button>
              </div>
            )) : <p className="text-sm text-muted-foreground">No history for this session.</p>}
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PasteDataModal;

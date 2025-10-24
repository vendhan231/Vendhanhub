import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, FileText, Filter, Eye } from 'lucide-react';
import { apiFetchProjects } from '@/services/api';

interface Project {
  id: string;
  name: string;
}

interface ProcessedData {
  fileName: string;
  data: {
    objectIds: string[];
    extractedFields: Record<string, any>[];
    totalRecords: number;
  };
  projectIds: string[];
}

const AdminReportUpload: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [filters, setFilters] = useState({
    date: '',
    objectId: '',
    name: '',
    manifestId: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const fetchedProjects = await apiFetchProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      toast.error('Failed to load projects');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0 || selectedProjects.length === 0) {
      toast.error('Please select files and projects');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      uploadedFiles.forEach(file => formData.append('files', file));
      formData.append('projectIds', JSON.stringify(selectedProjects));

      const response = await fetch('http://localhost:3002/api/work-reports/admin-process-files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process files');
      }

      const data = await response.json();
      setProcessedData(data.data);
      setActiveTab('data');
      toast.success('Files processed successfully');
    } catch (error) {
      toast.error('Failed to process files');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = processedData.map(pd => ({
    ...pd,
    data: {
      ...pd.data,
      extractedFields: pd.data.extractedFields.filter(row => {
        const matchesDate = !filters.date || row.Date?.includes(filters.date);
        const matchesObjectId = !filters.objectId || row.Object_ID?.includes(filters.objectId);
        const matchesName = !filters.name || row.Name?.includes(filters.name);
        const matchesManifestId = !filters.manifestId || row.Manifest_ID?.includes(filters.manifestId);
        return matchesDate && matchesObjectId && matchesName && matchesManifestId;
      }),
    },
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Reports for Projects</CardTitle>
          <CardDescription>Upload files to update reports for selected projects</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="data" disabled={processedData.length === 0}>Data</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-4">
              <div>
                <Label>Select Projects</Label>
                <Select onValueChange={(value) => setSelectedProjects(prev => [...prev, value])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose projects" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  {selectedProjects.map(id => (
                    <span key={id} className="inline-block bg-primary text-primary-foreground px-2 py-1 rounded mr-2">
                      {projects.find(p => p.id === id)?.name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <Label>Upload Files</Label>
                <input type="file" multiple accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                <div className="mt-2">
                  {uploadedFiles.map(file => (
                    <div key={file.name} className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={processFiles} disabled={loading}>
                {loading ? 'Processing...' : 'Process Files'}
              </Button>
            </TabsContent>
            <TabsContent value="data" className="space-y-4">
              <div className="flex gap-4">
                <Input placeholder="Filter by date" value={filters.date} onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))} />
                <Input placeholder="Filter by object ID" value={filters.objectId} onChange={(e) => setFilters(prev => ({ ...prev, objectId: e.target.value }))} />
                <Input placeholder="Filter by name" value={filters.name} onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))} />
                <Input placeholder="Filter by manifest ID" value={filters.manifestId} onChange={(e) => setFilters(prev => ({ ...prev, manifestId: e.target.value }))} />
              </div>
              <Tabs value="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">All Projects</TabsTrigger>
                  {selectedProjects.map(id => (
                    <TabsTrigger key={id} value={id}>{projects.find(p => p.id === id)?.name}</TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="all">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Object ID</TableHead>
                        <TableHead>Fields</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.flatMap(pd => pd.data.extractedFields.map(row => (
                        <TableRow key={row.Object_ID}>
                          <TableCell>{pd.fileName}</TableCell>
                          <TableCell>{row.Object_ID}</TableCell>
                          <TableCell>{JSON.stringify(row)}</TableCell>
                        </TableRow>
                      )))}
                    </TableBody>
                  </Table>
                </TabsContent>
                {selectedProjects.map(id => (
                  <TabsContent key={id} value={id}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File</TableHead>
                          <TableHead>Object ID</TableHead>
                          <TableHead>Fields</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.filter(pd => pd.projectIds.includes(id)).flatMap(pd => pd.data.extractedFields.map(row => (
                          <TableRow key={row.Object_ID}>
                            <TableCell>{pd.fileName}</TableCell>
                            <TableCell>{row.Object_ID}</TableCell>
                            <TableCell>{JSON.stringify(row)}</TableCell>
                          </TableRow>
                        )))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReportUpload;
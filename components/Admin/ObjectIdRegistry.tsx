import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { apiFetchProjects, apiFetchAllUsers } from '../../services/api';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Users,
  FolderOpen,
  BarChart3
} from 'lucide-react';

interface ObjectIdEntry {
  id: string;
  objectId: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  userFullName: string;
  department: string;
  reportId: string;
  createdAt: string;
  reportDate: string;
}

interface ObjectIdHistory {
  objectId: string;
  usageCount: number;
  history: ObjectIdEntry[];
}

interface ObjectIdStats {
  totalEntries: number;
  uniqueObjectIds: number;
  projectBreakdown: Array<{
    projectId: string;
    projectName: string;
    count: number;
  }>;
  userBreakdown: Array<{
    userId: string;
    userName: string;
    userFullName: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    objectId: string;
    projectName: string;
    userName: string;
    userFullName: string;
    createdAt: string;
  }>;
}

const ObjectIdRegistry: React.FC = () => {
  const [entries, setEntries] = useState<ObjectIdEntry[]>([]);
  const [stats, setStats] = useState<ObjectIdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<ObjectIdHistory | null>(null);
  const [projects, setProjects] = useState<Array<{id: string, name: string, billingType?: string, ratePerHour?: number}>>([]);
  const [users, setUsers] = useState<Array<{id: string, username: string, fullName: string, department?: string}>>([]);

  const pageSize = 20;

  useEffect(() => {
    loadStats();
    loadProjects();
    loadUsers();
  }, []);

  useEffect(() => {
    loadEntries();
  }, [searchTerm, projectFilter, userFilter, sortBy, sortOrder, currentPage]);

  const loadStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/object-ids/stats/overview`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading Object ID stats:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const projectsData = await apiFetchProjects();
      const formattedProjects = projectsData.map(project => ({
        id: project.id,
        name: project.name,
        billingType: project.billingType,
        ratePerHour: project.ratePerHour
      }));
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await apiFetchAllUsers();
      const formattedUsers = usersData.map(user => ({
        id: user.id,
        username: user.username,
        fullName: `${user.firstName} ${user.lastName}`,
        department: user.department
      }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(projectFilter && projectFilter !== 'all' && { projectId: projectFilter }),
        ...(userFilter && userFilter !== 'all' && { userId: userFilter }),
      });

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/object-ids?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.data);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error loading Object ID entries:', error);
      toast.error('Failed to load Object ID registry');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (objectId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/object-ids/${objectId}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
        setHistoryModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading Object ID history:', error);
      toast.error('Failed to load Object ID history');
    }
  };

  const handleExport = () => {
    // Export functionality would go here
    toast.success('Export functionality coming soon');
  };

  const handleBulkDelete = () => {
    // Bulk delete functionality would go here
    toast.success('Bulk delete functionality coming soon');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="glass-card shadow-soft">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-foreground">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                Object ID Registry
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Track and manage all Object IDs across projects and users
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Bulk Delete
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Stats Cards */}
        {stats && (
          <CardContent className="pb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-card border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{stats.totalEntries.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Entries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-l-4 border-l-secondary">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Users className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary-foreground">{stats.uniqueObjectIds.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Unique Object IDs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-l-4 border-l-accent">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <FolderOpen className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-accent-foreground">{stats.projectBreakdown.length}</p>
                      <p className="text-sm text-muted-foreground">Active Projects</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-l-4 border-l-destructive">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <Clock className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{stats.recentActivity.length}</p>
                      <p className="text-sm text-muted-foreground">Recent Activity</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Filters */}
      <Card className="glass-card shadow-soft">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Object ID</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search Object IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex flex-col">
                        <span>{project.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {project.billingType === 'hourly' ? `$${project.ratePerHour}/hr` : 'Count Based'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span>{user.fullName} (@{user.username})</span>
                        <span className="text-xs text-muted-foreground">
                          {user.department || 'No Department'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="objectId">Object ID</SelectItem>
                  <SelectItem value="projectName">Project</SelectItem>
                  <SelectItem value="userName">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={sortOrder === 'asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('asc')}
            >
              Ascending
            </Button>
            <Button
              variant={sortOrder === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('desc')}
            >
              Descending
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Object ID Table */}
      <Card className="glass-card shadow-soft">
        <CardHeader className="pb-4">
          <CardTitle>Object ID Entries</CardTitle>
          <CardDescription>
            {entries.length} entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Object ID</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Report Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          {entry.objectId}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadHistory(entry.objectId)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{entry.projectName}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.userFullName}</div>
                          <div className="text-sm text-muted-foreground">@{entry.userName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{entry.department || 'N/A'}</TableCell>
                      <TableCell>{entry.reportDate}</TableCell>
                      <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadHistory(entry.objectId)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Object ID Usage History</DialogTitle>
            <DialogDescription>
              Complete history of Object ID usage across all projects and users
            </DialogDescription>
          </DialogHeader>

          {historyData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Object ID: {historyData.objectId}</h3>
                  <p className="text-sm text-muted-foreground">
                    Used {historyData.usageCount} times across {historyData.history.length} reports
                  </p>
                </div>
                <Badge variant={historyData.usageCount > 1 ? "destructive" : "default"}>
                  {historyData.usageCount > 1 ? "Duplicate Found" : "Unique"}
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Report Date</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.projectName}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.userFullName}</div>
                          <div className="text-sm text-muted-foreground">@{entry.userName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{entry.reportDate}</TableCell>
                      <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ObjectIdRegistry;

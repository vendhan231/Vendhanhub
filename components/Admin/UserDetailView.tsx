import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Edit,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Building
} from "lucide-react";

interface UserDetail {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'EMPLOYEE';
  department?: string;
  phone?: string;
  joinDate?: string;
  profilePictureUrl?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  totalHours?: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requestedAt: string;
  adminNotes?: string;
}

interface WorkReport {
  id: string;
  date: string;
  projectName: string;
  hoursWorked: number;
  description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
}

const UserDetailView = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [workReports, setWorkReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // API configuration
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';
  const getAuthToken = (): string | null => {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.warn('Failed to get auth token from localStorage:', error);
      return null;
    }
  };

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load comprehensive user details from the backend API
      const token = getAuthToken();

      const userResponse = await fetch(`${API_BASE_URL}/user-details/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!userResponse.ok) {
        if (userResponse.status === 401 || userResponse.status === 403) {
          await logout();
          navigate('/welcome');
          return;
        }
        if (userResponse.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`Failed to load user details: ${userResponse.statusText}`);
      }

      const userDetailData = await userResponse.json();

      // Set user data
      setUser({
        id: userDetailData.user.id,
        username: userDetailData.user.username,
        email: userDetailData.user.email,
        firstName: userDetailData.user.firstName,
        lastName: userDetailData.user.lastName,
        role: userDetailData.user.role === 'admin' ? 'ADMIN' : 'EMPLOYEE',
        department: userDetailData.user.department,
        phone: userDetailData.user.phone,
        joinDate: userDetailData.user.joinDate,
        profilePictureUrl: userDetailData.user.profilePictureUrl,
      });

      // Set attendance data
      setAttendance(userDetailData.attendance || []);

      // Set leave requests data
      setLeaveRequests(userDetailData.leaveRequests || []);

      // Set work reports data
      setWorkReports(userDetailData.workReports || []);

    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast.error(error.message || "Failed to load user data");

      // If API fails, redirect back to users list
      setTimeout(() => {
        navigate('/admin/users');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditReport = async (reportId: string, updates: any) => {
    try {
      const baseUrl = API_BASE_URL.replace('/api', '');
      const token = getAuthToken();
      const response = await fetch(`${baseUrl}/work-reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          await logout();
          navigate('/welcome');
          return;
        }
        throw new Error('Failed to update report');
      }

      toast.success("Report updated successfully");
      loadUserData(); // Reload data
    } catch (error: any) {
      toast.error(error.message || "Failed to update report");
    }
  };

  const handleUpdateLeaveStatus = async (leaveId: string, status: string, adminNotes?: string) => {
    try {
      const baseUrl = API_BASE_URL.replace('/api', '');
      const token = getAuthToken();
      const response = await fetch(`${baseUrl}/leave-requests/${leaveId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ status, adminNotes }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          await logout();
          navigate('/welcome');
          return;
        }
        throw new Error('Failed to update leave request');
      }

      toast.success("Leave request updated successfully");
      loadUserData(); // Reload data
    } catch (error: any) {
      toast.error(error.message || "Failed to update leave request");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">User not found</p>
        <Button onClick={() => navigate('/admin/users')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
      </div>

      {/* User Overview Card */}
      <Card className="glass-card shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <User className="w-6 h-6 text-primary" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{user.department || 'Not assigned'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium">{user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Join Date</p>
                <p className="font-medium">
                  {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different data views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave Requests</TabsTrigger>
          <TabsTrigger value="reports">Work Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Attendance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {attendance.filter(a => a.clockInTime).length}
                </div>
                <p className="text-sm text-muted-foreground">Days present this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary" />
                  Leave Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">
                  {leaveRequests.filter(l => l.status === 'PENDING').length}
                </div>
                <p className="text-sm text-muted-foreground">Pending approvals</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  Work Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  {workReports.length}
                </div>
                <p className="text-sm text-muted-foreground">Total reports submitted</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>View and manage user attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        record.clockInTime ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.clockInTime ?
                            `Clock in: ${new Date(record.clockInTime).toLocaleTimeString()}` :
                            'Absent'
                          }
                          {record.clockOutTime && ` • Clock out: ${new Date(record.clockOutTime).toLocaleTimeString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {record.totalHours ? `${record.totalHours.toFixed(2)}h` : 'N/A'}
                      </p>
                      <Badge variant={record.clockInTime ? 'default' : 'destructive'}>
                        {record.clockInTime ? 'Present' : 'Absent'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {attendance.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No attendance records found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Requests Tab */}
        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>Manage user leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={
                            request.status === 'APPROVED' ? 'default' :
                            request.status === 'REJECTED' ? 'destructive' :
                            request.status === 'PENDING' ? 'secondary' : 'outline'
                          }>
                            {request.status}
                          </Badge>
                          <span className="font-medium">{request.leaveType}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm">{request.reason}</p>
                        {request.adminNotes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Admin Notes:</strong> {request.adminNotes}
                          </p>
                        )}
                      </div>
                      {request.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateLeaveStatus(request.id, 'APPROVED')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUpdateLeaveStatus(request.id, 'REJECTED')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {leaveRequests.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No leave requests found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Reports</CardTitle>
              <CardDescription>View and edit user work reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workReports.map((report) => (
                  <div key={report.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={
                            report.status === 'APPROVED' ? 'default' :
                            report.status === 'SUBMITTED' ? 'secondary' : 'outline'
                          }>
                            {report.status}
                          </Badge>
                          <span className="font-medium">{report.projectName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(report.date).toLocaleDateString()} • {report.hoursWorked}h worked
                        </p>
                        <p className="text-sm">{report.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditReport(report.id, { status: 'APPROVED' })}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Open edit dialog for the report
                            toast.info("Edit functionality will be implemented");
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {workReports.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No work reports found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDetailView;
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Users, UserPlus, Pencil, Trash2, Search } from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'EMPLOYEE';
  department?: string;
  joinDate?: string;
  createdAt: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "EMPLOYEE" as 'ADMIN' | 'EMPLOYEE',
    department: "",
    password: "",
  });

  const loadUsers = async () => {
    try {
      // For now, we'll use mock data since we don't have API endpoints yet
      // In a real implementation, this would call an API
      const mockUsers: User[] = [
        {
          id: '1',
          username: 'renuga',
          email: 'renuga@company.com',
          firstName: 'Renuga',
          lastName: 'Admin',
          role: 'ADMIN',
          department: 'Administration',
          joinDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          username: 'angeeswari',
          email: 'angeeswari@company.com',
          firstName: 'Angeeswari',
          lastName: '',
          role: 'EMPLOYEE',
          department: 'Operations',
          joinDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      setUsers(mockUsers);
    } catch (error: any) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "EMPLOYEE",
      department: "",
      password: "",
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      if (editingUser) {
        // Update user logic would go here
        toast.success("User updated successfully");
      } else {
        // Create user logic would go here
        toast.success("User created successfully");
      }

      setDialogOpen(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department || "",
      password: "", // Don't populate password for editing
    });
    setDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
        // Delete user logic would go here (remove userId if not used)
      toast.success("User deleted successfully");
          await loadUsers(); // This line uses userId, ensure it's used correctly
    } catch (error: any) {
      toast.error("Failed to delete user");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="glass-card shadow-soft">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                User Management
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Manage system users and their permissions with professional controls
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="btn-modern bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 shadow-medium border border-primary/20"
                  onClick={() => {
                    setEditingUser(null);
                    resetForm();
                  }}
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl glass-card shadow-strong">
                <DialogHeader className="pb-6">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-foreground">
                    <div className={`p-2 rounded-lg ${editingUser ? 'bg-secondary/20 border border-secondary/30' : 'bg-accent/20 border border-accent/30'}`}>
                      {editingUser ? <Pencil className="w-6 h-6 text-secondary-foreground" /> : <UserPlus className="w-6 h-6 text-accent-foreground" />}
                    </div>
                    {editingUser ? "Edit User" : "Create New User"}
                  </DialogTitle>
                  <DialogDescription className="text-base mt-2">
                    {editingUser ? "Update user information and permissions" : "Add a new user to the system with appropriate role and permissions"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.role} onValueChange={(value: 'ADMIN' | 'EMPLOYEE') => setFormData({ ...formData, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMPLOYEE">Employee</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                  </div>

                  {!editingUser && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingUser}
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    className={`w-full h-12 text-base font-semibold btn-modern shadow-medium ${
                      editingUser
                        ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        : "bg-accent hover:bg-accent/90 text-accent-foreground"
                    } border border-transparent`}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {editingUser ? "Update User" : "Create User"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search users by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base border-2 focus:border-primary/50 transition-all duration-300 shadow-soft"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="glass-card border-l-4 border-l-primary shadow-soft hover:shadow-medium transition-all duration-300 animate-slide-up">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-semibold text-foreground">
                          {user.firstName} {user.lastName}
                        </CardTitle>
                        <CardDescription className="mt-2 text-base">
                          @{user.username} • {user.email}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Role:</span>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold shadow-soft ${
                        user.role === 'ADMIN'
                          ? "bg-secondary/20 text-secondary-foreground border border-secondary/30"
                          : "bg-accent/20 text-accent-foreground border border-accent/30"
                      }`}>
                        {user.role}
                      </span>
                    </div>

                    {user.department && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Department:</span>
                        <span className="text-sm font-medium">{user.department}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="text-sm font-medium">
                        {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found matching your search.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
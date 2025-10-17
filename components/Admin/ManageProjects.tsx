import { useState, useEffect } from "react";
import { apiFetchProjects, apiAddProject, apiUpdateProject, apiDeleteProject } from "../../services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FolderPlus, Loader2, Trash2, Calculator, Pencil } from "lucide-react";
import { ProjectFieldBuilder, type ProjectField } from "./ProjectFieldBuilder";

interface Project {
  id: string;
  name: string;
  description: string;
  billing_formula: string;
  item_fields: ProjectField[];
  is_active: boolean;
  edit_window_hours: number;
}

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    billingFormula: "",
    editWindowHours: 24,
  });
  const [fields, setFields] = useState<ProjectField[]>([]);
  const [testValues, setTestValues] = useState<Record<string, number>>({});
  const [calculatedTest, setCalculatedTest] = useState<number>(0);

  const loadProjects = async () => {
    try {
  const fetched = await apiFetchProjects();
  setProjects((fetched || []) as unknown as Project[]);
    } catch (error: any) {
      toast.error("Failed to load projects");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const testFormula = () => {
    try {
      let formula = formData.billingFormula;

      fields.forEach((field) => {
        if (field.type === 'number') {
          const value = testValues[field.label] || 0;
          formula = formula.replace(new RegExp(field.label, 'g'), value.toString());
        }
      });

      const result = eval(formula);
      setCalculatedTest(Number(result) || 0);
      toast.success(`Formula test: Rs. ${Number(result).toFixed(2)}`);
    } catch (e) {
      toast.error("Invalid formula syntax");
      setCalculatedTest(0);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", billingFormula: "", editWindowHours: 24 });
    setFields([]);
    setTestValues({});
    setCalculatedTest(0);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fields.length === 0) {
      toast.error("Please add at least one field");
      return;
    }

    setLoading(true);

    try {
      if (editingProject) {
        await apiUpdateProject(editingProject.id, {
          name: formData.name,
          description: formData.description,
          billing_formula: formData.billingFormula,
          item_fields: fields as any,
          edit_window_hours: formData.editWindowHours,
        } as any);
        toast.success("Project updated successfully");
      } else {
        await apiAddProject({
          name: formData.name,
          description: formData.description,
          billing_formula: formData.billingFormula,
          item_fields: fields as any,
          edit_window_hours: formData.editWindowHours,
          created_by: null,
          is_active: true,
        } as any);
        toast.success("Project created successfully");
      }

      setDialogOpen(false);
      setEditingProject(null);
      resetForm();
      loadProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      billingFormula: project.billing_formula,
      editWindowHours: project.edit_window_hours || 24,
    });
    setFields(project.item_fields || []);
    setDialogOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await apiDeleteProject(projectId);
      toast.success("Project deleted successfully");
      loadProjects();
    } catch (error: any) {
      toast.error("Failed to delete project");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Management</CardTitle>
              <CardDescription>Create and manage projects with dynamic fields and billing formulas</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary" onClick={() => {
                  setEditingProject(null);
                  resetForm();
                }}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Configure project with custom fields and billing formula
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editWindow">Edit Window (hours)</Label>
                    <Input
                      id="editWindow"
                      type="number"
                      min={1}
                      value={formData.editWindowHours}
                      onChange={(e) => setFormData({ ...formData, editWindowHours: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Users can edit their own reports within this time window
                    </p>
                  </div>

                  <ProjectFieldBuilder fields={fields} onChange={setFields} />

                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="formula">Billing Formula (PRIVATE - Hidden from users)</Label>
                      <Input
                        id="formula"
                        value={formData.billingFormula}
                        onChange={(e) => setFormData({ ...formData, billingFormula: e.target.value })}
                        placeholder="e.g., CharacterCount/1000*4.85"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Use field labels from above. Example: (CharacterCount/1000)*4.85 or RecordCount*1.25
                      </p>
                    </div>

                    {/* Formula Tester */}
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Formula Tester
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-3">
                          {fields.filter(f => f.type === 'number').map((field) => (
                            <div key={field.id} className="space-y-1">
                              <Label className="text-xs">{field.label}</Label>
                              <Input
                                type="number"
                                value={testValues[field.label] || ""}
                                onChange={(e) => setTestValues({
                                  ...testValues,
                                  [field.label]: Number(e.target.value),
                                })}
                                placeholder="0"
                                className="h-8"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <Button type="button" variant="outline" size="sm" onClick={testFormula}>
                            Calculate Test
                          </Button>
                          <span className="text-lg font-bold text-primary">
                            Rs. {calculatedTest.toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingProject ? "Update Project" : "Create Project"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                        {project.description && (
                          <CardDescription className="mt-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(project)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Fields:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                          Object_ID (text) *
                        </span>
                        {(project.item_fields ?? []).map((field) => (
                          <span
                            key={field.id}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground"
                          >
                            {field.label} ({field.type}) {field.required && '*'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Status:</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.is_active
                            ? "bg-success/20 text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {project.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Edit Window:</span>
                      <span className="text-sm font-medium">{project.edit_window_hours} hours</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectManagement;

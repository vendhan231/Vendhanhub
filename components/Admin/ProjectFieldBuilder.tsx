import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface ProjectField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "textarea";
  required: boolean;
  order: number;
}

interface ProjectFieldBuilderProps {
  fields: ProjectField[];
  onChange: (fields: ProjectField[]) => void;
}

export const ProjectFieldBuilder = ({ fields, onChange }: ProjectFieldBuilderProps) => {
  const addField = () => {
    const newField: ProjectField = {
      id: `field_${Date.now()}`,
      label: "",
      type: "number",
      required: false,
      order: fields.length,
    };
    onChange([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<ProjectField>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Project Fields (Object_ID is always required)</Label>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      <div className="space-y-3">
  {fields.map((field) => (
          <Card key={field.id} className="border-l-4 border-l-primary/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <GripVertical className="w-5 h-5 text-muted-foreground mt-2" />

                <div className="flex-1 grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Field Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="e.g., Character Count"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Field Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value: "text" | "number" | "date" | "textarea") =>
                        updateField(field.id, { type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end pb-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`required-${field.id}`}
                        checked={field.required}
                        onCheckedChange={(checked) =>
                          updateField(field.id, { required: !!checked })
                        }
                      />
                      <Label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer">
                        Required
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
          No fields added yet. Click "Add Field" to create custom fields for this project.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Tip: Use field labels in your billing formula (e.g., "CharacterCount/1000*4.85")
      </p>
    </div>
  );
};
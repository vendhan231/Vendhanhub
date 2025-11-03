import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProjectData {
  name: string;
  description?: string;
  billing_formula: string;
  item_fields: any[];
  edit_window_hours?: number;
  is_template?: boolean;
  template_category?: string;
  is_active?: boolean;
}

interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  billing_formula: string;
  item_fields: any[];
  edit_window_hours?: number;
  is_template?: boolean;
  template_category?: string;
  is_active?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Convert frontend format to backend format
const convertToBackendFormat = (data: ProjectData) => {
  const itemFields = ensureObjectIdInFields(data.item_fields);

  return {
    name: data.name,
    description: data.description,
    fieldConfig: JSON.stringify({
      report_level: [],
      item_level: itemFields.map(field => ({
        label: field.label,
        type: field.type,
        required: field.required,
        options: field.options || [],
        unique: field.unique || false,
        includeInBilling: field.includeInBilling || false,
      }))
    }),
    billingConfig: JSON.stringify({
      rateType: 'custom_formula',
      formula: data.billing_formula,
      rateValue: 0,
    }),
    is_active: data.is_active,
  };
};

// Convert backend format to frontend format
const convertFromBackendFormat = (project: any): ProjectResponse => {
  const fieldConfig = project.fieldConfig ? JSON.parse(project.fieldConfig) : { report_level: [], item_level: [] };
  const billingConfig = project.billingConfig ? JSON.parse(project.billingConfig) : {};

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    billing_formula: billingConfig.formula || '',
    item_fields: fieldConfig.item_level || [],
    edit_window_hours: project.edit_window_hours,
    is_template: project.is_template,
    template_category: project.template_category,
    is_active: project.is_active,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
};

const ensureObjectIdInFields = (itemFields: any[]) => {
  const fields = Array.isArray(itemFields) ? [...itemFields] : [];
  const hasObjectId = fields.some((f: any) => (f.label || '').toLowerCase() === 'object_id' || (f.label || '').toLowerCase() === 'object id');
  if (!hasObjectId) {
    fields.unshift({ id: 'object_id', label: 'Object_ID', type: 'text', required: true, order: 0 });
  } else {
    fields.forEach((f: any) => {
      if ((f.label || '').toLowerCase() === 'object_id' || (f.label || '').toLowerCase() === 'object id') {
        f.required = true;
      }
    });
  }
  return fields;
};

export const createProject = async (data: ProjectData) => {
  const backendData = convertToBackendFormat(data);
  const project = await prisma.project.create({
    data: backendData as any,
  });
  return convertFromBackendFormat(project);
};

export const getProjectById = async (id: string) => {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return null;
  return convertFromBackendFormat(project);
};

export const updateProject = async (id: string, data: Partial<ProjectData>) => {
  const backendData = convertToBackendFormat(data as ProjectData);
  const project = await prisma.project.update({ where: { id }, data: backendData as any });
  return convertFromBackendFormat(project);
};

export const deleteProject = async (id: string) => {
  return await prisma.project.delete({ where: { id } });
};

export const getAllProjects = async () => {
  const projects = await prisma.project.findMany();
  return projects.map((project: any) => convertFromBackendFormat(project));
};
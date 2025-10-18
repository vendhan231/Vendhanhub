import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProjectData {
  name: string;
  billingConfig: any; // JSON-serializable billing config
  fieldConfig: any; // JSON-serializable field config (report_level, item_level)
  is_active?: boolean;
  description?: string | null;
}

const ensureObjectIdInFieldConfig = (fieldConfig: any) => {
  const fc = fieldConfig || { report_level: [], item_level: [] };
  fc.item_level = Array.isArray(fc.item_level) ? [...fc.item_level] : [];
  const hasObjectId = fc.item_level.some((f: any) => (f.label || '').toLowerCase() === 'object id' || (f.label || '').toLowerCase() === 'objectid');
  if (!hasObjectId) {
    fc.item_level.unshift({ label: 'Object ID', type: 'text', required: true });
  } else {
    fc.item_level.forEach((f: any) => {
      if ((f.label || '').toLowerCase() === 'object id' || (f.label || '').toLowerCase() === 'objectid') {
        f.required = true;
      }
    });
  }
  return fc;
};

export const createProject = async (data: ProjectData) => {
  const fieldConfig = ensureObjectIdInFieldConfig(data.fieldConfig);
  return await prisma.project.create({
    // cast data to any because generated Prisma input types in this workspace
    // don't match perfectly yet — we'll reconcile types across the codebase.
    data: {
      name: data.name,
      fieldConfig: JSON.stringify(fieldConfig),
      billingConfig: JSON.stringify(data.billingConfig || {}),
    } as any,
  });
};

export const getProjectById = async (id: string) => {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return null;
  return {
    ...project,
    fieldConfig: project.fieldConfig ? JSON.parse(project.fieldConfig) : { report_level: [], item_level: [] },
    billingConfig: project.billingConfig ? JSON.parse(project.billingConfig) : {},
  };
};

export const updateProject = async (id: string, data: Partial<ProjectData>) => {
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.fieldConfig) updateData.fieldConfig = JSON.stringify(ensureObjectIdInFieldConfig(data.fieldConfig));
  if (data.billingConfig) updateData.billingConfig = JSON.stringify(data.billingConfig);
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  if (data.description !== undefined) updateData.description = data.description;
  const project = await prisma.project.update({ where: { id }, data: updateData });
  return {
    ...project,
    fieldConfig: project.fieldConfig ? JSON.parse(project.fieldConfig) : { report_level: [], item_level: [] },
    billingConfig: project.billingConfig ? JSON.parse(project.billingConfig) : {},
  };
};

export const deleteProject = async (id: string) => {
  return await prisma.project.delete({ where: { id } });
};

export const getAllProjects = async () => {
  const projects = await prisma.project.findMany();
  return projects.map((project: any) => ({
    ...project,
    fieldConfig: project.fieldConfig ? JSON.parse(project.fieldConfig) : { report_level: [], item_level: [] },
    billingConfig: project.billingConfig ? JSON.parse(project.billingConfig) : {},
  }));
};
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProjectData {
  name: string;
  fieldConfig: {
    report_level: Array<{
      label: string;
      type: string;
      options?: string[];
      unique?: boolean;
      required?: boolean;
    }>;
    item_level: Array<{
      label: string;
      type: string;
      options?: string[];
      unique?: boolean;
      required?: boolean;
    }>;
  };
  billingConfig: {
    rateType: string;
    rateValue: number;
    countField?: string;
  };
}

export const createProject = async (data: ProjectData) => {
  return await prisma.project.create({
    data: {
      name: data.name,
      fieldConfig: JSON.stringify(data.fieldConfig),
      billingConfig: JSON.stringify(data.billingConfig),
    },
  });
};

export const getProjectById = async (id: string) => {
  const project = await prisma.project.findUnique({
    where: { id },
  });
  if (project) {
    return {
      ...project,
      fieldConfig: JSON.parse(project.fieldConfig),
      billingConfig: JSON.parse(project.billingConfig),
    };
  }
  return null;
};

export const updateProject = async (id: string, data: Partial<ProjectData>) => {
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.fieldConfig) updateData.fieldConfig = JSON.stringify(data.fieldConfig);
  if (data.billingConfig) updateData.billingConfig = JSON.stringify(data.billingConfig);

  const project = await prisma.project.update({
    where: { id },
    data: updateData,
  });
  return {
    ...project,
    fieldConfig: JSON.parse(project.fieldConfig),
    billingConfig: JSON.parse(project.billingConfig),
  };
};

export const deleteProject = async (id: string) => {
  return await prisma.project.delete({
    where: { id },
  });
};

export const getAllProjects = async () => {
  const projects = await prisma.project.findMany();
  return projects.map(project => ({
    ...project,
    fieldConfig: JSON.parse(project.fieldConfig),
    billingConfig: JSON.parse(project.billingConfig),
  }));
};
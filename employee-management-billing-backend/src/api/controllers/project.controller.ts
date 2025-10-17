import { Request, Response } from 'express';
import { Project } from '@prisma/client';
import * as projectService from '../services/project.service';
import * as projectValidators from '../validators/project.validators';
import { validate } from '../middleware/validation.middleware';

export const createProject = async (req: Request, res: Response) => {
    const validatedData = await validate(projectValidators.createProjectSchema, req.body);
    const newProject: Project = await projectService.createProject(validatedData);
    res.status(201).json(newProject);
};

export const getAllProjects = async (req: Request, res: Response) => {
    const projects = await projectService.getAllProjects();
    res.status(200).json(projects);
};

export const getProjectById = async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    const project = await projectService.getProjectById(projectId);
    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json(project);
};

export const updateProject = async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    const validatedData = await validate(projectValidators.updateProjectSchema, req.body);
    const updatedProject = await projectService.updateProject(projectId, validatedData);
    if (!updatedProject) {
        return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json(updatedProject);
};

export const deleteProject = async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    const deleted = await projectService.deleteProject(projectId);
    if (!deleted) {
        return res.status(404).json({ message: 'Project not found' });
    }
    res.status(204).send();
};
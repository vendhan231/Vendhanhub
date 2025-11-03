import * as projectService from '../services/project.service';
import { createProjectValidator, updateProjectValidator } from '../validators/project.validators';

// Use any for req/res temporarily until express types resolve correctly in the
// workspace (this avoids collisions with DOM Request/Response during tsc).
export const createProject = async (req: any, res: any) => {
    try {
        const validatedData = createProjectValidator(req.body);
        const newProject = await projectService.createProject(validatedData);
        return res.status(201).json(newProject);
    } catch (error: any) {
        return res.status(400).json({ message: error?.message || 'Failed to create project' });
    }
};

export const getAllProjects = async (req: any, res: any) => {
    const projects = await projectService.getAllProjects();
    res.status(200).json(projects);
};

export const getProjectById = async (req: any, res: any) => {
    const projectId = req.params.projectId;
    const project = await projectService.getProjectById(projectId);
    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json(project);
};

export const updateProject = async (req: any, res: any) => {
    try {
        const projectId = req.params.projectId;
        const validatedData = updateProjectValidator(req.body);
        const updatedProject = await projectService.updateProject(projectId, validatedData);
        if (!updatedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }
        return res.status(200).json(updatedProject);
    } catch (error: any) {
        return res.status(400).json({ message: error?.message || 'Failed to update project' });
    }
};

export const getProjects = getAllProjects;

export const deleteProject = async (req: any, res: any) => {
    const projectId = req.params.projectId;
    const deleted = await projectService.deleteProject(projectId);
    if (!deleted) {
        return res.status(404).json({ message: 'Project not found' });
    }
    res.status(204).send();
};
import { Project, Area, SubArea, Process } from '@/types';
import { generateId } from '@/lib/utils';
import { modelStorage } from './modelStorage';
import { areaService } from './areaService';
import { subAreaService } from './subAreaService';
import { processService } from './processService';

const PROJECTS_KEY = 'wfstudio_projects';
const AREAS_KEY = 'wfstudio_areas';
const SUBAREAS_KEY = 'wfstudio_subareas';
const PROCESSES_KEY = 'wfstudio_processes';
// BPMN_MODELS_KEY_PREFIX is not used directly here anymore due to modelStorage

const getStoredItems = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const rawItem = window.localStorage.getItem(key);
  console.log('[projectService] getStoredItems - key:', key, 'raw item:', rawItem);
  try {
    return rawItem ? JSON.parse(rawItem) : [];
  } catch (e) {
    console.error(`Error parsing localStorage key ${key}:`, e);
    return [];
  }
};

const setStoredItems = <T>(key: string, items: T[]): void => {
  console.log('[projectService] setStoredItems - key:', key, 'items being set:', items);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
    console.log('[projectService] Successfully called setStoredItems for key:', key);
  } catch (e) {
    console.error(`Error setting localStorage key ${key}:`, e);
  }
};

export const projectService = {
  getProjects: (): Project[] => {
    return getStoredItems<Project>(PROJECTS_KEY);
  },

  getProject: (id: string): Project | undefined => {
    return projectService.getProjects().find(p => p.id === id);
  },

  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
    console.log('[projectService] createProject - projectData:', projectData);
    const projects = projectService.getProjects();
    const trimmedName = projectData.name.trim();
    const trimmedCode = projectData.code.trim();

    if (!trimmedName) throw new Error("Project name cannot be empty.");
    if (!trimmedCode) throw new Error("Project code cannot be empty.");

    if (projects.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error(`A project with the name "${trimmedName}" already exists.`);
    }
    if (projects.some(p => p.code.toLowerCase() === trimmedCode.toLowerCase())) {
      throw new Error(`A project with the code "${trimmedCode}" already exists.`);
    }

    const newProject: Project = {
      ...projectData,
      id: generateId(),
      name: trimmedName, // Ensure name and code are trimmed
      code: trimmedCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log('[projectService] Saving projects to localStorage. New project:', newProject, 'All projects:', [...projects, newProject]);
    setStoredItems<Project>(PROJECTS_KEY, [...projects, newProject]);
    console.log('[projectService] Returning new project:', newProject);
    return newProject;
  },

  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Project => {
    let projects = projectService.getProjects();
    const projectIndex = projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
      throw new Error("Project not found for updating. It may have been deleted.");
    }

    const currentProject = projects[projectIndex];

    // Prepare new values, trimming if they are strings and provided in updates
    const newName = updates.name?.trim();
    const newCode = updates.code?.trim();

    if (newName === '') throw new Error("Project name cannot be empty.");
    if (newCode === '') throw new Error("Project code cannot be empty.");

    // Check for duplicate name if name is changing
    if (newName && newName.toLowerCase() !== currentProject.name.toLowerCase()) {
      if (projects.some(p => p.id !== id && p.name.toLowerCase() === newName.toLowerCase())) {
        throw new Error(`Another project with the name "${newName}" already exists.`);
      }
    }
    // Check for duplicate code if code is changing
    if (newCode && newCode.toLowerCase() !== currentProject.code.toLowerCase()) {
      if (projects.some(p => p.id !== id && p.code.toLowerCase() === newCode.toLowerCase())) {
        throw new Error(`Another project with the code "${newCode}" already exists.`);
      }
    }

    const updatedProjectData = { ...currentProject, ...updates };
    if (newName) updatedProjectData.name = newName;
    if (newCode) updatedProjectData.code = newCode;
    // description and status can be partial, so they are spread from updates directly

    const updatedProject = {
      ...updatedProjectData,
      updatedAt: new Date().toISOString(),
    };
    projects[projectIndex] = updatedProject;
    setStoredItems<Project>(PROJECTS_KEY, projects);
    return updatedProject;
  },

  // getProjectById is an alias for getProject
  getProjectById: (id: string): Project | undefined => {
    return projectService.getProject(id);
  },

  deleteProject: (id: string): boolean => {
    let currentProjects = projectService.getProjects();
    const projectToDelete = currentProjects.find(p => p.id === id);
    if (!projectToDelete) {
        // console.warn(`Project with id ${id} not found for deletion.`);
        return false; // Indicate not found or already deleted
    }

    currentProjects = currentProjects.filter(p => p.id !== id);
    setStoredItems<Project>(PROJECTS_KEY, currentProjects);

    let areas = getStoredItems<Area>(AREAS_KEY);
    const projectAreas = areas.filter(a => a.projectId === id);
    areas = areas.filter(a => a.projectId !== id);
    setStoredItems<Area>(AREAS_KEY, areas);

    let subAreas = getStoredItems<SubArea>(SUBAREAS_KEY);
    const areaIdsToDelete = projectAreas.map(a => a.id);
    const projectSubAreas = subAreas.filter(sa => areaIdsToDelete.includes(sa.areaId));
    subAreas = subAreas.filter(sa => !areaIdsToDelete.includes(sa.areaId));
    setStoredItems<SubArea>(SUBAREAS_KEY, subAreas);

    let processes = getStoredItems<Process>(PROCESSES_KEY);
    const subAreaIdsToDelete = projectSubAreas.map(sa => sa.id);
    const projectProcesses = processes.filter(p => subAreaIdsToDelete.includes(p.subAreaId));
    processes = processes.filter(p => !subAreaIdsToDelete.includes(p.subAreaId));
    setStoredItems<Process>(PROCESSES_KEY, processes);

    projectProcesses.forEach(proc => {
        modelStorage.deleteModelsForProcess(proc.id);
    });
    return true;
  },

  getProjectModelsCount: (projectId: string): number => {
    let count = 0;
    const areas = areaService.getAreas(projectId); // Assumes getAreas can filter by projectId
    for (const area of areas) {
      const subAreas = subAreaService.getSubAreas(area.id); // Assumes getSubAreas can filter by areaId
      for (const subArea of subAreas) {
        const processes = processService.getProcesses(subArea.id); // Assumes getProcesses can filter by subAreaId
        for (const process of processes) {
          count += modelStorage.getModelsForProcess(process.id).length;
        }
      }
    }
    return count;
  },
};

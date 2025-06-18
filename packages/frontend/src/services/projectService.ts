import { Project, Area, SubArea, Process, BpmnModel } from '@/types';
// import useLocalStorage from '@/hooks/useLocalStorage'; // Not used directly
import { generateId } from '@/lib/utils'; // Assuming a utility for ID generation
import { modelStorage } from './modelStorage';

const PROJECTS_KEY = 'wfstudio_projects';
const AREAS_KEY = 'wfstudio_areas';
const SUBAREAS_KEY = 'wfstudio_subareas';
const PROCESSES_KEY = 'wfstudio_processes';
const BPMN_MODELS_KEY_PREFIX = 'wfstudio_bpmn_'; // For individual model XMLs

// Helper function to get all items of a certain type from localStorage
// This is a simplified example; actual services might use the hook differently or directly
// For services, direct usage of localStorage or a more complex state management might be preferred
// over using the hook directly within service methods if services are classes or plain objects.
// However, if the services themselves are hooks (e.g., useProjectService), then it's fine.

// For this subtask, we'll assume services are plain objects/classes for now
// and will interact with localStorage directly or via a wrapper that doesn't rely on React's lifecycle.
// Re-evaluating the hook's direct use in services:
// The `useLocalStorage` hook is designed for React components.
// For services (which are typically plain JS/TS classes or objects),
// we should create direct localStorage interaction utilities or use the hook's underlying logic.

// Let's create simple localStorage utility functions for services for now.
// These won't be reactive in the same way as the hook but are suitable for service layers.

const getStoredItems = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const item = window.localStorage.getItem(key);
  try {
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error(`Error parsing localStorage key ${key}:`, e);
    return [];
  }
};

const setStoredItems = <T>(key: string, items: T[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error(`Error setting localStorage key ${key}:`, e);
  }
};

const removeStoredItem = (key: string): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
}

export const projectService = {
  getProjects: (): Project[] => {
    return getStoredItems<Project>(PROJECTS_KEY);
  },

  getProject: (id: string): Project | undefined => {
    return projectService.getProjects().find(p => p.id === id);
  },

  createProject: (projectData: Pick<Project, 'name'>): Project => {
    const projects = projectService.getProjects();
    const newProject: Project = {
      id: generateId(),
      ...projectData,
    };
    setStoredItems<Project>(PROJECTS_KEY, [...projects, newProject]);
    return newProject;
  },

  updateProject: (id: string, updates: Partial<Pick<Project, 'name'>>): Project | undefined => {
    const projects = projectService.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return undefined;

    const updatedProject = { ...projects[index], ...updates };
    projects[index] = updatedProject;
    setStoredItems<Project>(PROJECTS_KEY, projects);
    return updatedProject;
  },

  deleteProject: (id: string): boolean => {
    let projects = projectService.getProjects();
    const projectToDelete = projects.find(p => p.id === id);
    if (!projectToDelete) return false;

    projects = projects.filter(p => p.id !== id);
    setStoredItems<Project>(PROJECTS_KEY, projects);

    // Cascade delete: Areas, SubAreas, Processes, BpmnModels
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

    // Delete associated BPMN model XMLs
    projectProcesses.forEach(proc => {
        modelStorage.deleteModelsForProcess(proc.id);
    });


    return true;
  },
};

// We also need to create/update `packages/frontend/src/lib/utils.ts` for `generateId`
// For now, this subtask will focus on the service file.
// A separate step might be needed for util functions if not already present.
// Assume `generateId` exists for now.

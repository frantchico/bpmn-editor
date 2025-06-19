import { Area, SubArea, Process, BpmnModel } from '@/types';
import { generateId } from '@/lib/utils';
import { modelStorage } from './modelStorage';
import { subAreaService } from './subAreaService';
import { processService } from './processService';

const AREAS_KEY = 'wfstudio_areas';
const SUBAREAS_KEY = 'wfstudio_subareas';
const PROCESSES_KEY = 'wfstudio_processes';
// BPMN_MODELS_KEY_PREFIX is not used directly here since modelStorage handles it.

// Helper functions (assuming these are standard across services)
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

export const areaService = {
  getAreas: (projectId?: string): Area[] => {
    const areas = getStoredItems<Area>(AREAS_KEY);
    return projectId ? areas.filter(a => a.projectId === projectId) : areas;
  },

  getArea: (id: string): Area | undefined => {
    return areaService.getAreas().find(a => a.id === id);
  },

  createArea: (areaData: Omit<Area, 'id'>): Area => {
    // Ensure all necessary fields are destructured, then safely trim name and code
    const { projectId } = areaData;
    const trimmedName = (areaData.name || '').trim();
    const trimmedCode = (areaData.code || '').trim();

    if (!trimmedName) throw new Error("Area name cannot be empty.");
    if (!trimmedCode) throw new Error("Area code cannot be empty.");
    if (!projectId) throw new Error("Project ID is required to create an area.");

    const allAreas = getStoredItems<Area>(AREAS_KEY);
    const projectAreas = allAreas.filter(a => a.projectId === projectId);

    if (projectAreas.some(a => a.name && a.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error(`An area with the name "${trimmedName}" already exists in this project.`);
    }
    if (projectAreas.some(a => a.code && a.code.toLowerCase() === trimmedCode.toLowerCase())) {
      throw new Error(`An area with the code "${trimmedCode}" already exists in this project.`);
    }

    const newArea: Area = {
      ...areaData,
      id: generateId(),
      name: trimmedName,
      code: trimmedCode
      // description and status are spread from areaData
    };
    setStoredItems<Area>(AREAS_KEY, [...allAreas, newArea]);
    return newArea;
  },

  updateArea: (id: string, updates: Partial<Omit<Area, 'id' | 'projectId'>>): Area => {
    let allAreas = getStoredItems<Area>(AREAS_KEY);
    const areaIndex = allAreas.findIndex(a => a.id === id);

    if (areaIndex === -1) {
      throw new Error("Area not found for updating. It may have been deleted.");
    }

    const currentArea = allAreas[areaIndex];
    const newName = updates.name?.trim();
    const newCode = updates.code?.trim();

    if (newName === '') throw new Error("Area name cannot be empty.");
    if (newCode === '') throw new Error("Area code cannot be empty.");

    const currentAreaNameLower = (currentArea.name || '').toLowerCase();
    const currentAreaCodeLower = (currentArea.code || '').toLowerCase();

    if (newName && newName.toLowerCase() !== currentAreaNameLower) {
      const projectAreas = allAreas.filter(a => a.projectId === currentArea.projectId);
      if (projectAreas.some(a => a.id !== id && a.name && a.name.toLowerCase() === newName.toLowerCase())) {
        throw new Error(`Another area with the name "${newName}" already exists in this project.`);
      }
    }
    if (newCode && newCode.toLowerCase() !== currentAreaCodeLower) {
      const projectAreas = allAreas.filter(a => a.projectId === currentArea.projectId);
      if (projectAreas.some(a => a.id !== id && a.code && a.code.toLowerCase() === newCode.toLowerCase())) {
        throw new Error(`Another area with the code "${newCode}" already exists in this project.`);
      }
    }

    const updatedAreaData = { ...currentArea, ...updates };
    if (newName) updatedAreaData.name = newName;
    if (newCode) updatedAreaData.code = newCode;

    const updatedArea = { ...updatedAreaData }; // No specific 'updatedAt' for Area in model
    allAreas[areaIndex] = updatedArea;
    setStoredItems<Area>(AREAS_KEY, allAreas);
    return updatedArea;
  },

  // getAreaById is an alias for getArea
  getAreaById: (id: string): Area | undefined => {
    return areaService.getArea(id);
  },

  deleteArea: (id: string): boolean => {
    let areas = getStoredItems<Area>(AREAS_KEY);
    const areaToDelete = areas.find(a => a.id === id);
    if (!areaToDelete) return false;

    areas = areas.filter(a => a.id !== id);
    setStoredItems<Area>(AREAS_KEY, areas);

    let subAreas = getStoredItems<SubArea>(SUBAREAS_KEY);
    const areaSubAreas = subAreas.filter(sa => sa.areaId === id);
    subAreas = subAreas.filter(sa => sa.areaId !== id);
    setStoredItems<SubArea>(SUBAREAS_KEY, subAreas);

    let processes = getStoredItems<Process>(PROCESSES_KEY);
    const subAreaIdsToDelete = areaSubAreas.map(sa => sa.id);
    const areaProcesses = processes.filter(p => subAreaIdsToDelete.includes(p.subAreaId));
    processes = processes.filter(p => !subAreaIdsToDelete.includes(p.subAreaId));
    setStoredItems<Process>(PROCESSES_KEY, processes);

    areaProcesses.forEach(proc => {
        modelStorage.deleteModelsForProcess(proc.id);
    });
    return true;
  },

  getAreaModelsCount: (areaId: string): number => {
    let count = 0;
    const subAreas = subAreaService.getSubAreas(areaId); // Assumes getSubAreas filters by areaId
    for (const subArea of subAreas) {
      const processes = processService.getProcesses(subArea.id); // Assumes getProcesses filters by subAreaId
      for (const process of processes) {
        count += modelStorage.getModelsForProcess(process.id).length;
      }
    }
    return count;
  },
};

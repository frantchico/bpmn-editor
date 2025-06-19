import { Area, SubArea, Process } from '@/types';
import { generateId } from '@/lib/utils';
import { modelStorage } from './modelStorage';

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

  createArea: (areaData: Pick<Area, 'name' | 'projectId'>): Area => {
    const { name, projectId } = areaData;
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Area name cannot be empty.");
    }
    const allAreas = getStoredItems<Area>(AREAS_KEY);
    const projectAreas = allAreas.filter(a => a.projectId === projectId);
    if (projectAreas.some(a => a.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error(`An area with the name "${trimmedName}" already exists in this project.`);
    }
    const newArea: Area = { id: generateId(), name: trimmedName, projectId };
    setStoredItems<Area>(AREAS_KEY, [...allAreas, newArea]);
    return newArea;
  },

  updateArea: (id: string, updates: Partial<Pick<Area, 'name' /*| 'projectId' */ >>): Area => {
    // For this refactor, we are only allowing 'name' updates. Updating projectId would be more complex.
    let allAreas = getStoredItems<Area>(AREAS_KEY);
    const areaIndex = allAreas.findIndex(a => a.id === id);

    if (areaIndex === -1) {
      throw new Error("Area not found for updating. It may have been deleted.");
    }

    const currentArea = allAreas[areaIndex];
    let newTrimmedName = currentArea.name;

    if (updates.name !== undefined) {
        newTrimmedName = updates.name.trim();
        if (!newTrimmedName) {
            throw new Error("Area name cannot be empty.");
        }
        if (newTrimmedName.toLowerCase() !== currentArea.name.toLowerCase()) {
            const projectAreas = allAreas.filter(a => a.projectId === currentArea.projectId);
            if (projectAreas.some(a => a.id !== id && a.name.toLowerCase() === newTrimmedName.toLowerCase())) {
                throw new Error(`Another area with the name "${newTrimmedName}" already exists in this project.`);
            }
        }
    }

    const updatedArea = { ...currentArea, name: newTrimmedName };
    allAreas[areaIndex] = updatedArea;
    setStoredItems<Area>(AREAS_KEY, allAreas);
    return updatedArea;
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
};

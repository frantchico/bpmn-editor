import { Area, SubArea, Process } from '@/types';
import { generateId } from '@/lib/utils';
import { modelStorage } from './modelStorage';

const AREAS_KEY = 'wfstudio_areas';
const SUBAREAS_KEY = 'wfstudio_subareas';
const PROCESSES_KEY = 'wfstudio_processes';
const BPMN_MODELS_KEY_PREFIX = 'wfstudio_bpmn_';

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

export const areaService = {
  getAreas: (projectId?: string): Area[] => {
    const areas = getStoredItems<Area>(AREAS_KEY);
    return projectId ? areas.filter(a => a.projectId === projectId) : areas;
  },

  getArea: (id: string): Area | undefined => {
    return areaService.getAreas().find(a => a.id === id);
  },

  createArea: (areaData: Pick<Area, 'name' | 'projectId'>): Area => {
    const areas = areaService.getAreas();
    const newArea: Area = {
      id: generateId(),
      ...areaData,
    };
    setStoredItems<Area>(AREAS_KEY, [...areas, newArea]);
    return newArea;
  },

  updateArea: (id: string, updates: Partial<Pick<Area, 'name' | 'projectId'>>): Area | undefined => {
    const areas = areaService.getAreas();
    const index = areas.findIndex(a => a.id === id);
    if (index === -1) return undefined;

    const updatedArea = { ...areas[index], ...updates };
    areas[index] = updatedArea;
    setStoredItems<Area>(AREAS_KEY, areas);
    return updatedArea;
  },

  deleteArea: (id: string): boolean => {
    let areas = getStoredItems<Area>(AREAS_KEY);
    const areaToDelete = areas.find(a => a.id === id);
    if (!areaToDelete) return false;

    areas = areas.filter(a => a.id !== id);
    setStoredItems<Area>(AREAS_KEY, areas);

    // Cascade delete: SubAreas, Processes, BpmnModels
    let subAreas = getStoredItems<SubArea>(SUBAREAS_KEY);
    const areaSubAreas = subAreas.filter(sa => sa.areaId === id);
    subAreas = subAreas.filter(sa => sa.areaId !== id);
    setStoredItems<SubArea>(SUBAREAS_KEY, subAreas);

    let processes = getStoredItems<Process>(PROCESSES_KEY);
    const subAreaIdsToDelete = areaSubAreas.map(sa => sa.id);
    const areaProcesses = processes.filter(p => subAreaIdsToDelete.includes(p.subAreaId)); // Assuming processes are under subareas
    // If processes can be directly under areas, adjust logic here
    processes = processes.filter(p => !subAreaIdsToDelete.includes(p.subAreaId));
    setStoredItems<Process>(PROCESSES_KEY, processes);

    areaProcesses.forEach(proc => {
        modelStorage.deleteModelsForProcess(proc.id);
    });

    return true;
  },
};

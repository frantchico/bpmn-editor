import { SubArea, Process } from '@/types';
import { generateId } from '@/lib/utils';
import { modelStorage } from './modelStorage';

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

export const subAreaService = {
  getSubAreas: (areaId?: string): SubArea[] => {
    const subAreas = getStoredItems<SubArea>(SUBAREAS_KEY);
    return areaId ? subAreas.filter(sa => sa.areaId === areaId) : subAreas;
  },

  getSubArea: (id: string): SubArea | undefined => {
    return subAreaService.getSubAreas().find(sa => sa.id === id);
  },

  createSubArea: (subAreaData: Pick<SubArea, 'name' | 'areaId'>): SubArea => {
    const subAreas = subAreaService.getSubAreas();
    const newSubArea: SubArea = {
      id: generateId(),
      ...subAreaData,
    };
    setStoredItems<SubArea>(SUBAREAS_KEY, [...subAreas, newSubArea]);
    return newSubArea;
  },

  updateSubArea: (id: string, updates: Partial<Pick<SubArea, 'name' | 'areaId'>>): SubArea | undefined => {
    const subAreas = subAreaService.getSubAreas();
    const index = subAreas.findIndex(sa => sa.id === id);
    if (index === -1) return undefined;

    const updatedSubArea = { ...subAreas[index], ...updates };
    subAreas[index] = updatedSubArea;
    setStoredItems<SubArea>(SUBAREAS_KEY, subAreas);
    return updatedSubArea;
  },

  deleteSubArea: (id: string): boolean => {
    let subAreas = getStoredItems<SubArea>(SUBAREAS_KEY);
    const subAreaToDelete = subAreas.find(sa => sa.id === id);
    if (!subAreaToDelete) return false;

    subAreas = subAreas.filter(sa => sa.id !== id);
    setStoredItems<SubArea>(SUBAREAS_KEY, subAreas);

    // Cascade delete: Processes, BpmnModels
    let processes = getStoredItems<Process>(PROCESSES_KEY);
    const subAreaProcesses = processes.filter(p => p.subAreaId === id);
    processes = processes.filter(p => p.subAreaId !== id);
    setStoredItems<Process>(PROCESSES_KEY, processes);

    subAreaProcesses.forEach(proc => {
        modelStorage.deleteModelsForProcess(proc.id);
    });

    return true;
  },
};

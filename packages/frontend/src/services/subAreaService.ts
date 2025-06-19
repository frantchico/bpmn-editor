import { SubArea, Process } from '@/types';
import { generateId } from '@/lib/utils';
import { modelStorage } from './modelStorage';

const SUBAREAS_KEY = 'wfstudio_subareas';
const PROCESSES_KEY = 'wfstudio_processes';
// BPMN_MODELS_KEY_PREFIX is not used directly here

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

export const subAreaService = {
  getSubAreas: (areaId?: string): SubArea[] => {
    const subAreas = getStoredItems<SubArea>(SUBAREAS_KEY);
    return areaId ? subAreas.filter(sa => sa.areaId === areaId) : subAreas;
  },

  getSubArea: (id: string): SubArea | undefined => {
    return subAreaService.getSubAreas().find(sa => sa.id === id);
  },

  createSubArea: (subAreaData: Pick<SubArea, 'name' | 'areaId'>): SubArea => {
    const { name, areaId } = subAreaData;
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("SubArea name cannot be empty.");
    }
    const allSubAreas = getStoredItems<SubArea>(SUBAREAS_KEY);
    const parentAreaSubAreas = allSubAreas.filter(sa => sa.areaId === areaId);
    if (parentAreaSubAreas.some(sa => sa.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error(`A sub-area with the name "${trimmedName}" already exists in this area.`);
    }
    const newSubArea: SubArea = { id: generateId(), name: trimmedName, areaId };
    setStoredItems<SubArea>(SUBAREAS_KEY, [...allSubAreas, newSubArea]);
    return newSubArea;
  },

  updateSubArea: (id: string, updates: Partial<Pick<SubArea, 'name' /* | 'areaId' */>>): SubArea => {
    let allSubAreas = getStoredItems<SubArea>(SUBAREAS_KEY);
    const subAreaIndex = allSubAreas.findIndex(sa => sa.id === id);

    if (subAreaIndex === -1) {
      throw new Error("SubArea not found for updating. It may have been deleted.");
    }

    const currentSubArea = allSubAreas[subAreaIndex];
    let newTrimmedName = currentSubArea.name;

    if (updates.name !== undefined) {
        newTrimmedName = updates.name.trim();
        if (!newTrimmedName) {
            throw new Error("SubArea name cannot be empty.");
        }
        if (newTrimmedName.toLowerCase() !== currentSubArea.name.toLowerCase()) {
            const parentAreaSubAreas = allSubAreas.filter(sa => sa.areaId === currentSubArea.areaId);
            if (parentAreaSubAreas.some(sa => sa.id !== id && sa.name.toLowerCase() === newTrimmedName.toLowerCase())) {
                throw new Error(`Another sub-area with the name "${newTrimmedName}" already exists in this area.`);
            }
        }
    }

    const updatedSubArea = { ...currentSubArea, name: newTrimmedName };
    allSubAreas[subAreaIndex] = updatedSubArea;
    setStoredItems<SubArea>(SUBAREAS_KEY, allSubAreas);
    return updatedSubArea;
  },

  deleteSubArea: (id: string): boolean => {
    let subAreas = getStoredItems<SubArea>(SUBAREAS_KEY);
    const subAreaToDelete = subAreas.find(sa => sa.id === id);
    if (!subAreaToDelete) return false;

    subAreas = subAreas.filter(sa => sa.id !== id);
    setStoredItems<SubArea>(SUBAREAS_KEY, subAreas);

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

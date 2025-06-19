import { SubArea, Process, BpmnModel } from '@/types';
import { generateId } from '@/lib/utils';
import { modelStorage } from './modelStorage';
import { processService } from './processService';

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

  createSubArea: (subAreaData: Omit<SubArea, 'id'>): SubArea => {
    const { name, code, areaId, projectId } = subAreaData; // Ensure all necessary fields
    const trimmedName = name.trim();
    const trimmedCode = code.trim();

    if (!trimmedName) throw new Error("SubArea name cannot be empty.");
    if (!trimmedCode) throw new Error("SubArea code cannot be empty.");
    if (!areaId) throw new Error("Area ID is required to create a sub-area.");
    if (!projectId) throw new Error("Project ID is required to create a sub-area.");


    const allSubAreas = getStoredItems<SubArea>(SUBAREAS_KEY);
    const parentAreaSubAreas = allSubAreas.filter(sa => sa.areaId === areaId);

    if (parentAreaSubAreas.some(sa => sa.name && sa.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error(`A sub-area with the name "${trimmedName}" already exists in this area.`);
    }
    if (parentAreaSubAreas.some(sa => sa.code && sa.code.toLowerCase() === trimmedCode.toLowerCase())) {
      throw new Error(`A sub-area with the code "${trimmedCode}" already exists in this area.`);
    }

    const newSubArea: SubArea = {
      ...subAreaData,
      id: generateId(),
      name: trimmedName,
      code: trimmedCode
      // description, status, projectId are spread from subAreaData
    };
    setStoredItems<SubArea>(SUBAREAS_KEY, [...allSubAreas, newSubArea]);
    return newSubArea;
  },

  updateSubArea: (id: string, updates: Partial<Omit<SubArea, 'id' | 'areaId'>>): SubArea => {
    // Now allows 'projectId' to be part of 'updates'
    let allSubAreas = getStoredItems<SubArea>(SUBAREAS_KEY);
    const subAreaIndex = allSubAreas.findIndex(sa => sa.id === id);

    if (subAreaIndex === -1) {
      throw new Error("SubArea not found for updating. It may have been deleted.");
    }

    const currentSubArea = allSubAreas[subAreaIndex];
    const newName = updates.name?.trim();
    const newCode = updates.code?.trim();

    if (newName === '') throw new Error("SubArea name cannot be empty.");
    if (newCode === '') throw new Error("SubArea code cannot be empty.");

    const currentSubAreaNameLower = (currentSubArea.name || '').toLowerCase();
    const currentSubAreaCodeLower = (currentSubArea.code || '').toLowerCase();

    if (newName && newName.toLowerCase() !== currentSubAreaNameLower) {
      const parentAreaSubAreas = allSubAreas.filter(sa => sa.areaId === currentSubArea.areaId);
      if (parentAreaSubAreas.some(sa => sa.id !== id && sa.name && sa.name.toLowerCase() === newName.toLowerCase())) {
        throw new Error(`Another sub-area with the name "${newName}" already exists in this area.`);
      }
    }
    if (newCode && newCode.toLowerCase() !== currentSubAreaCodeLower) {
      const parentAreaSubAreas = allSubAreas.filter(sa => sa.areaId === currentSubArea.areaId);
      if (parentAreaSubAreas.some(sa => sa.id !== id && sa.code && sa.code.toLowerCase() === newCode.toLowerCase())) {
        throw new Error(`Another sub-area with the code "${newCode}" already exists in this area.`);
      }
    }

    const updatedSubAreaData = { ...currentSubArea, ...updates };
    if (newName) updatedSubAreaData.name = newName;
    if (newCode) updatedSubAreaData.code = newCode;

    const updatedSubArea = { ...updatedSubAreaData }; // No specific 'updatedAt' for SubArea in model
    allSubAreas[subAreaIndex] = updatedSubArea;
    setStoredItems<SubArea>(SUBAREAS_KEY, allSubAreas);
    return updatedSubArea;
  },

  // getSubAreaById is an alias for getSubArea
  getSubAreaById: (id: string): SubArea | undefined => {
    return subAreaService.getSubArea(id);
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

  getSubAreaModelsCount: (subAreaId: string): number => {
    let count = 0;
    const processes = processService.getProcesses(subAreaId); // Assumes getProcesses filters by subAreaId
    for (const process of processes) {
      count += modelStorage.getModelsForProcess(process.id).length;
    }
    return count;
  },
};

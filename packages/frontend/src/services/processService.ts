import { Process } from '@/types';
import { generateId } from '@/lib/utils';
import { modelStorage } from './modelStorage'; // Correctly imported

const PROCESSES_KEY = 'wfstudio_processes';
// BPMN_MODELS_KEY_PREFIX removed as modelStorage handles this

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

export const processService = {
  getProcesses: (subAreaId?: string): Process[] => {
    const processes = getStoredItems<Process>(PROCESSES_KEY);
    return subAreaId ? processes.filter(p => p.subAreaId === subAreaId) : processes;
  },

  getProcess: (id: string): Process | undefined => {
    return processService.getProcesses().find(p => p.id === id);
  },

  createProcess: (processData: Pick<Process, 'name' | 'subAreaId'>): Process => {
    const { name, subAreaId } = processData;
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Process name cannot be empty.");
    }
    const allProcesses = getStoredItems<Process>(PROCESSES_KEY);
    const parentSubAreaProcesses = allProcesses.filter(p => p.subAreaId === subAreaId);
    if (parentSubAreaProcesses.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error(`A process with the name "${trimmedName}" already exists in this sub-area.`);
    }
    const newProcess: Process = { id: generateId(), name: trimmedName, subAreaId };
    setStoredItems<Process>(PROCESSES_KEY, [...allProcesses, newProcess]);
    return newProcess;
  },

  updateProcess: (id: string, updates: Partial<Pick<Process, 'name' /* | 'subAreaId' */>>): Process => {
    let allProcesses = getStoredItems<Process>(PROCESSES_KEY);
    const processIndex = allProcesses.findIndex(p => p.id === id);

    if (processIndex === -1) {
      throw new Error("Process not found for updating. It may have been deleted.");
    }

    const currentProcess = allProcesses[processIndex];
    let newTrimmedName = currentProcess.name;

    if (updates.name !== undefined) {
        newTrimmedName = updates.name.trim();
        if (!newTrimmedName) {
            throw new Error("Process name cannot be empty.");
        }
        if (newTrimmedName.toLowerCase() !== currentProcess.name.toLowerCase()) {
            const parentSubAreaProcesses = allProcesses.filter(p => p.subAreaId === currentProcess.subAreaId);
            if (parentSubAreaProcesses.some(p => p.id !== id && p.name.toLowerCase() === newTrimmedName.toLowerCase())) {
                throw new Error(`Another process with the name "${newTrimmedName}" already exists in this sub-area.`);
            }
        }
    }

    const updatedProcess = { ...currentProcess, name: newTrimmedName };
    allProcesses[processIndex] = updatedProcess;
    setStoredItems<Process>(PROCESSES_KEY, allProcesses);
    return updatedProcess;
  },

  deleteProcess: (id: string): boolean => {
    let processes = getStoredItems<Process>(PROCESSES_KEY);
    const processToDelete = processes.find(p => p.id === id);
    if (!processToDelete) return false;

    processes = processes.filter(p => p.id !== id);
    setStoredItems<Process>(PROCESSES_KEY, processes);

    modelStorage.deleteModelsForProcess(id); // This handles associated BPMN model data
    return true;
  },
};

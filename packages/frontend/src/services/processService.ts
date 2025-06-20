import { Process } from '@/types';
import { generateId } from '@/lib/utils';
import { modelStorage } from './modelStorage'; // Correctly imported
import { subAreaService } from './subAreaService';

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

  createProcess: (processData: Omit<Process, 'id'>): Process => {
    // Safely access and trim name and code
    const trimmedName = (processData.name || '').trim();
    const trimmedCode = (processData.code || '').trim();
    // Destructure other required fields for validation after initial access
    const { subAreaId, ...restOfProcessData } = processData; // projectId removed, rest captured

    if (!trimmedName) throw new Error("Process name cannot be empty.");
    if (!trimmedCode) throw new Error("Process code cannot be empty.");
    if (!subAreaId) throw new Error("SubArea ID is required to create a process.");
    // if (!projectId) throw new Error("Project ID is required to create a process."); // Validation removed

    const derivedProjectId = subAreaService.getProjectIdForSubArea(subAreaId);
    if (!derivedProjectId) {
      // Consider if this error message is user-facing or for console.
      // It might be better to throw an error that can be caught and handled by the UI.
      console.error(`[processService] Could not derive Project ID for process creation via SubArea ID: ${subAreaId}. Parent area or project might be missing.`);
      throw new Error("Failed to determine the project context for this process. The parent sub-area or area may be invalid or inaccessible.");
    }

    const allProcesses = getStoredItems<Process>(PROCESSES_KEY);
    const parentSubAreaProcesses = allProcesses.filter(p => p.subAreaId === subAreaId);

    if (parentSubAreaProcesses.some(p => p.name && p.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error(`A process with the name "${trimmedName}" already exists in this sub-area.`);
    }
    if (parentSubAreaProcesses.some(p => p.code && p.code.toLowerCase() === trimmedCode.toLowerCase())) {
      throw new Error(`A process with the code "${trimmedCode}" already exists in this sub-area.`);
    }

    const { description: dataDescription, status: dataStatus, model: dataModel, version: dataVersion, updatedAt: dataUpdatedAt } = restOfProcessData as Omit<Process, 'id' | 'projectId' | 'name' | 'code' | 'subAreaId'>;

    const newProcess: Process = {
      id: generateId(),
      name: trimmedName, // from original trimmedName
      code: trimmedCode, // from original trimmedCode
      subAreaId: subAreaId, // from original subAreaId
      description: dataDescription || '',
      status: dataStatus || 'Planned',
      model: dataModel || '', // Default model if necessary
      version: dataVersion === undefined ? 1 : dataVersion, // Default version
      updatedAt: dataUpdatedAt || new Date().toISOString(), // Default updatedAt
      projectId: derivedProjectId, // Use the derived project ID
    };
    setStoredItems<Process>(PROCESSES_KEY, [...allProcesses, newProcess]);
    return newProcess;
  },

  updateProcess: (id: string, updates: Partial<Omit<Process, 'id' | 'subAreaId' | 'projectId'>>): Process => {
    // projectId is not directly updatable as it's derived.
    let allProcesses = getStoredItems<Process>(PROCESSES_KEY);
    const processIndex = allProcesses.findIndex(p => p.id === id);

    if (processIndex === -1) {
      throw new Error("Process not found for updating. It may have been deleted.");
    }

    const currentProcess = allProcesses[processIndex];
    const newName = updates.name?.trim();
    const newCode = updates.code?.trim();

    if (newName === '') throw new Error("Process name cannot be empty.");
    if (newCode === '') throw new Error("Process code cannot be empty.");

    const currentProcessNameLower = (currentProcess.name || '').toLowerCase();
    const currentProcessCodeLower = (currentProcess.code || '').toLowerCase();

    if (newName && newName.toLowerCase() !== currentProcessNameLower) {
      const parentSubAreaProcesses = allProcesses.filter(p => p.subAreaId === currentProcess.subAreaId);
      if (parentSubAreaProcesses.some(p => p.id !== id && p.name && p.name.toLowerCase() === newName.toLowerCase())) {
        throw new Error(`Another process with the name "${newName}" already exists in this sub-area.`);
      }
    }
    if (newCode && newCode.toLowerCase() !== currentProcessCodeLower) {
      const parentSubAreaProcesses = allProcesses.filter(p => p.subAreaId === currentProcess.subAreaId);
      if (parentSubAreaProcesses.some(p => p.id !== id && p.code && p.code.toLowerCase() === newCode.toLowerCase())) {
        throw new Error(`Another process with the code "${newCode}" already exists in this sub-area.`);
      }
    }

    const updatedProcessData = { ...currentProcess, ...updates };
    if (newName) updatedProcessData.name = newName;
    if (newCode) updatedProcessData.code = newCode;
    // description, status, model, version, updatedAt are spread from updates
    // subAreaId and projectId are not changed here.

    const updatedProcess = { ...updatedProcessData };
    allProcesses[processIndex] = updatedProcess;
    setStoredItems<Process>(PROCESSES_KEY, allProcesses);
    return updatedProcess;
  },

  // getProcessById is an alias for getProcess
  getProcessById: (id: string): Process | undefined => {
    return processService.getProcess(id);
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

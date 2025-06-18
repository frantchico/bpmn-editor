import { Process } from '@/types';
import { generateId } from '@/lib/utils';

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

export const processService = {
  getProcesses: (subAreaId?: string): Process[] => {
    const processes = getStoredItems<Process>(PROCESSES_KEY);
    return subAreaId ? processes.filter(p => p.subAreaId === subAreaId) : processes;
  },

  getProcess: (id: string): Process | undefined => {
    return processService.getProcesses().find(p => p.id === id);
  },

  createProcess: (processData: Pick<Process, 'name' | 'subAreaId'>): Process => {
    const processes = processService.getProcesses();
    const newProcess: Process = {
      id: generateId(),
      ...processData,
    };
    setStoredItems<Process>(PROCESSES_KEY, [...processes, newProcess]);
    return newProcess;
  },

  updateProcess: (id: string, updates: Partial<Pick<Process, 'name' | 'subAreaId'>>): Process | undefined => {
    const processes = processService.getProcesses();
    const index = processes.findIndex(p => p.id === id);
    if (index === -1) return undefined;

    const updatedProcess = { ...processes[index], ...updates };
    processes[index] = updatedProcess;
    setStoredItems<Process>(PROCESSES_KEY, processes);
    return updatedProcess;
  },

  deleteProcess: (id: string): boolean => {
    let processes = processService.getProcesses();
    const processToDelete = processes.find(p => p.id === id);
    if (!processToDelete) return false;

    processes = processes.filter(p => p.id !== id);
    setStoredItems<Process>(PROCESSES_KEY, processes);

    // Cascade delete: BpmnModel XML
    removeStoredItem(`${BPMN_MODELS_KEY_PREFIX}${id}`);

    return true;
  },
};

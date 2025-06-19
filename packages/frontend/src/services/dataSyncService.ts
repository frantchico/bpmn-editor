import { Project, Area, SubArea, Process, BpmnModel } from '@/types';

const PROJECTS_KEY = 'wfstudio_projects';
const AREAS_KEY = 'wfstudio_areas';
const SUBAREAS_KEY = 'wfstudio_subareas';
const PROCESSES_KEY = 'wfstudio_processes';
const BPMN_MODELS_METADATA_KEY = 'wfstudio_bpmn_models_metadata';
const BPMN_MODEL_XML_KEY_PREFIX = 'wfstudio_bpmn_';

interface ExportedData {
  projects: Project[];
  areas: Area[];
  subAreas: SubArea[];
  processes: Process[];
  bpmnModelsMetadata: Omit<BpmnModel, 'xml'>[];
  bpmnModelsXml: Record<string, string>;
  exportedAt: string;
}

const getStoredItems = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const item = window.localStorage.getItem(key);
  try {
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.warn(`Error parsing localStorage key ${key} during export:`, e);
    return [];
  }
};

const getModelXml = (processId: string): string | null => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(`${BPMN_MODEL_XML_KEY_PREFIX}${processId}`);
};

export const dataSyncService = {
  exportAllData: (): void => {
    if (typeof window === 'undefined') {
      console.error("Export function called in non-browser environment.");
      return;
    }

    const projects = getStoredItems<Project>(PROJECTS_KEY);
    const areas = getStoredItems<Area>(AREAS_KEY);
    const subAreas = getStoredItems<SubArea>(SUBAREAS_KEY);
    const processes = getStoredItems<Process>(PROCESSES_KEY);
    const bpmnModelsMetadata = getStoredItems<Omit<BpmnModel, 'xml'>>(BPMN_MODELS_METADATA_KEY);

    const bpmnModelsXml: Record<string, string> = {};
    const allProcessIdsWithPotentialModels = new Set([
        ...processes.map(p => p.id),
        ...bpmnModelsMetadata.map(m => m.processId)
    ]);

    allProcessIdsWithPotentialModels.forEach(processId => {
      const xml = getModelXml(processId);
      if (xml !== null) {
        bpmnModelsXml[processId] = xml;
      }
    });

    const dataToExport: ExportedData = {
      projects,
      areas,
      subAreas,
      processes,
      bpmnModelsMetadata,
      bpmnModelsXml,
      exportedAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wfstudio_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importAllData: (jsonData: string): { success: boolean; message: string } => {
    if (typeof window === 'undefined') {
      return { success: false, message: "Import function called in non-browser environment." };
    }

    try {
      const parsedData: ExportedData = JSON.parse(jsonData);

      if (
        !parsedData ||
        !Array.isArray(parsedData.projects) ||
        !Array.isArray(parsedData.areas) ||
        !Array.isArray(parsedData.subAreas) ||
        !Array.isArray(parsedData.processes) ||
        !Array.isArray(parsedData.bpmnModelsMetadata) ||
        typeof parsedData.bpmnModelsXml !== 'object'
      ) {
        throw new Error("Invalid or corrupted data file format.");
      }

      // Clear all wfstudio_ prefixed keys
      Object.keys(window.localStorage).forEach(key => {
        if (key.startsWith('wfstudio_')) {
          window.localStorage.removeItem(key);
        }
      });

      window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(parsedData.projects));
      window.localStorage.setItem(AREAS_KEY, JSON.stringify(parsedData.areas));
      window.localStorage.setItem(SUBAREAS_KEY, JSON.stringify(parsedData.subAreas));
      window.localStorage.setItem(PROCESSES_KEY, JSON.stringify(parsedData.processes));
      window.localStorage.setItem(BPMN_MODELS_METADATA_KEY, JSON.stringify(parsedData.bpmnModelsMetadata));

      for (const processId in parsedData.bpmnModelsXml) {
        if (Object.prototype.hasOwnProperty.call(parsedData.bpmnModelsXml, processId)) {
          window.localStorage.setItem(`${BPMN_MODEL_XML_KEY_PREFIX}${processId}`, parsedData.bpmnModelsXml[processId]);
        }
      }

      return { success: true, message: "Data imported successfully. Please refresh the page to see changes." };

    } catch (error) {
      console.error("Error importing data:", error);
      return { success: false, message: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}` };
    }
  },
};

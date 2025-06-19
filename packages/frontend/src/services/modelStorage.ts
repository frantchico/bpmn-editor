// src/services/modelStorage.ts
import { BpmnModel } from '@/types';
import { generateId } from '@/lib/utils'; // Assuming generateId is available

const BPMN_MODELS_METADATA_KEY = 'wfstudio_bpmn_models_metadata';
const BPMN_MODEL_XML_KEY_PREFIX = 'wfstudio_bpmn_';

// Helper to get metadata for all BPMN models
const getModelsMetadata = (): BpmnModel[] => {
  if (typeof window === 'undefined') return [];
  const item = window.localStorage.getItem(BPMN_MODELS_METADATA_KEY);
  try {
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error(`Error parsing localStorage key ${BPMN_MODELS_METADATA_KEY}:`, e);
    return [];
  }
};

// Helper to save metadata for all BPMN models
const setModelsMetadata = (metadata: BpmnModel[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BPMN_MODELS_METADATA_KEY, JSON.stringify(metadata));
  } catch (e) {
    console.error(`Error setting localStorage key ${BPMN_MODELS_METADATA_KEY}:`, e);
  }
};

// Helper to get BPMN XML for a specific process
const getModelXml = (processId: string): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(`${BPMN_MODEL_XML_KEY_PREFIX}${processId}`);
};

// Helper to save BPMN XML for a specific process
const setModelXml = (processId: string, xml: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${BPMN_MODEL_XML_KEY_PREFIX}${processId}`, xml);
  } catch (e) {
    console.error(`Error setting localStorage key ${BPMN_MODEL_XML_KEY_PREFIX}${processId}:`, e);
  }
};

// Helper to remove BPMN XML for a specific process
const removeModelXml = (processId: string): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(`${BPMN_MODEL_XML_KEY_PREFIX}${processId}`);
};


class ModelStorageService {
  // Obter todos os metadados dos modelos, opcionalmente filtrados por processId
  async getModels(processId?: string): Promise<Omit<BpmnModel, 'xml'>[]> {
    let metadata = getModelsMetadata();
    if (processId) {
      metadata = metadata.filter(m => m.processId === processId);
    }
    return metadata.map(({ xml, ...rest }) => rest); // Exclude XML from list view
  }

  // Obter um modelo específico, incluindo seu XML
  async getModel(id: string): Promise<BpmnModel | null> {
    const metadata = getModelsMetadata().find(m => m.id === id);
    if (!metadata) return null;

    const xml = getModelXml(metadata.processId);
    if (xml === null) {
        // This case implies metadata exists but XML is missing, which shouldn't happen with current logic.
        // Could log an error or handle as a corrupted entry.
        console.error(`XML for model ${id} (process ${metadata.processId}) not found, though metadata exists.`);
        return { ...metadata, xml: '' }; // Return with empty XML or handle error
    }
    return { ...metadata, xml };
  }

  // Obter XML de um modelo especifico dado o ID do processo
  async getModelXmlByProcessId(processId: string): Promise<string | null> {
    return getModelXml(processId);
  }


  // Salvar novo modelo
  async saveModel(modelData: Pick<BpmnModel, 'name' | 'xml' | 'processId' | 'description' | 'tags'>): Promise<BpmnModel> {
    const metadataList = getModelsMetadata();
    const now = new Date();

    // Check if a model for this processId already exists.
    // According to the requirement, each process has one BPMN model, so the model ID could be the process ID.
    // Let's assume for now that a BpmnModel has its own unique ID, and `processId` links it.
    // If a process should have only one model, this logic might need adjustment (e.g., update if exists).
    const existingModelForProcess = metadataList.find(m => m.processId === modelData.processId);
    if(existingModelForProcess) {
        // If a model for this process already exists, update it instead of creating a new one.
        // This aligns with "wfstudio_bpmn_[processId] → string (XML do modelo BPMN)"
        return this.updateModel(existingModelForProcess.id, modelData);
    }

    const newModel: BpmnModel = {
      id: generateId(), // Unique ID for the model metadata entry
      name: modelData.name,
      processId: modelData.processId,
      description: modelData.description || '',
      version: 1, // Initial version
      createdAt: now,
      updatedAt: now,
      tags: modelData.tags || [],
      xml: '', // XML is not stored in the metadata list by default
    };

    setModelsMetadata([...metadataList, { ...newModel, xml: undefined } ]); // Store metadata without XML
    setModelXml(newModel.processId, modelData.xml); // Store XML separately

    return { ...newModel, xml: modelData.xml }; // Return full model
  }

  // Atualizar modelo
  async updateModel(id: string, updates: Partial<Pick<BpmnModel, 'name' | 'xml' | 'description' | 'tags' | 'processId'>>): Promise<BpmnModel | null> {
    let metadataList = getModelsMetadata();
    const modelIndex = metadataList.findIndex(m => m.id === id);

    if (modelIndex === -1) {
      console.error(`Model metadata with id ${id} not found for update.`);
      return null;
    }

    const existingMetadata = metadataList[modelIndex];
    const updatedMetadata: BpmnModel = {
      ...existingMetadata,
      ...updates,
      updatedAt: new Date(),
      version: (existingMetadata.version || 0) + 1,
      xml: '', // XML not in metadata list
    };

    // If processId changes, old XML storage needs to be removed.
    if (updates.processId && updates.processId !== existingMetadata.processId) {
        removeModelXml(existingMetadata.processId);
    }

    metadataList[modelIndex] = { ...updatedMetadata, xml: undefined }; // Update metadata list
    setModelsMetadata(metadataList);

    if (updates.xml) { // If XML is being updated
      setModelXml(updatedMetadata.processId, updates.xml);
    } else { // If XML is not part of updates, ensure current XML is preserved or fetched
      const currentXml = getModelXml(updatedMetadata.processId); // XML is stored by processId
      if (currentXml === null && updates.xml === undefined) {
        // This implies XML was expected but not found, and not provided in update.
        // This could happen if processId changed and new processId has no XML yet.
        // For now, if updates.xml is not provided, the existing XML for updatedMetadata.processId remains.
      }
    }

    const finalXml = updates.xml || getModelXml(updatedMetadata.processId) || "";

    return { ...updatedMetadata, xml: finalXml }; // Return updated model with its XML
  }

  // Deletar modelo
  async deleteModel(id: string): Promise<boolean> {
    let metadataList = getModelsMetadata();
    const modelToDelete = metadataList.find(m => m.id === id);

    if (!modelToDelete) {
      console.error(`Model metadata with id ${id} not found for deletion.`);
      return false;
    }

    setModelsMetadata(metadataList.filter(m => m.id !== id)); // Remove from metadata
    removeModelXml(modelToDelete.processId); // Remove XML from its storage

    return true;
  }

  // Delete all models associated with a processId (used by cascade deletes)
  async deleteModelsForProcess(processId: string): Promise<void> {
    let metadataList = getModelsMetadata();
    const modelsForProcess = metadataList.filter(m => m.processId === processId);

    if (modelsForProcess.length > 0) {
      const updatedMetadataList = metadataList.filter(m => m.processId !== processId);
      setModelsMetadata(updatedMetadataList);
      modelsForProcess.forEach(model => {
        removeModelXml(model.processId); // XML is stored by processId, so this is somewhat redundant if only one model per process
      });
    }
    // For the simple case of one model per process, this is enough:
    removeModelXml(processId);
  }


  // Exportar modelo como arquivo - This operates on client-side data
  exportModel(model: BpmnModel, format: 'bpmn' | 'json' = 'bpmn'): void {
    // This function should now fetch the full model if only metadata is passed
    // However, typically it will be called with a full BpmnModel object.
    let content: string;
    let mimeType: string;
    let extension: string;

    if (format === 'bpmn') {
      content = model.xml;
      mimeType = 'application/xml';
      extension = 'bpmn';
    } else {
      // For JSON export, we might want to use the frontend model structure
      const exportableModel = { ...model }; // Make sure 'xml' is included
      content = JSON.stringify(exportableModel, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${model.name.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Importar modelo de arquivo
  async importModel(file: File, processId: string): Promise<BpmnModel> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          let modelToSaveData: Pick<BpmnModel, 'name' | 'xml' | 'processId' | 'description' | 'tags'>;

          if (file.name.endsWith('.json')) {
            const importedData: Partial<BpmnModel> = JSON.parse(content);
            modelToSaveData = {
              name: importedData.name || 'Modelo Importado (JSON)',
              xml: importedData.xml || '', // XML is crucial
              processId: processId, // Assign to the given process
              description: importedData.description || '',
              tags: importedData.tags || []
            };
          } else { // Assuming .bpmn or .xml
            modelToSaveData = {
              name: file.name.replace(/\.(bpmn|xml)$/, ''),
              xml: content,
              processId: processId, // Assign to the given process
              description: 'Modelo importado de arquivo BPMN/XML',
              tags: ['importado']
            };
          }

          if (!modelToSaveData.xml) {
            throw new Error('Conteúdo XML do modelo não encontrado no arquivo importado.');
          }

          // Since each process is expected to have only one BPMN model string,
          // we check if a model for this processId already exists.
          const modelsMetadata = getModelsMetadata();
          const existingModel = modelsMetadata.find(m => m.processId === processId);

          if (existingModel) {
            // Update existing model
            const updatedModel = await this.updateModel(existingModel.id, {
              name: modelToSaveData.name,
              xml: modelToSaveData.xml, // Corrected variable name
              description: modelToSaveData.description,
              tags: modelToSaveData.tags,
            });
            if (!updatedModel) throw new Error('Failed to update existing model during import.');
            resolve(updatedModel);
          } else {
            // Create new model
            const savedModel = await this.saveModel(modelToSaveData);
            resolve(savedModel);
          }

        } catch (error) {
          console.error('Error processing imported file:', error);
          reject(new Error('Erro ao processar arquivo importado: ' + (error instanceof Error ? error.message : String(error))));
        }
      };

      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };

      reader.readAsText(file);
    });
  }
}

export const modelStorage = new ModelStorageService();

// Remove or comment out old Axios related code and default models if no longer needed.
// For example, the previous API_BASE_URL, backendToFrontendModel, and the old methods
// like getModels, getModel, saveModel, updateModel, deleteModel that use Axios.
// Also, getDefaultModels and getDefaultBpmnXml might be removed if not used.

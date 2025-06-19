// src/services/modelStorage.ts
import { BpmnModel } from '@/types';
import { generateId } from '@/lib/utils'; // Assuming generateId is available

const BPMN_MODELS_METADATA_KEY = 'wfstudio_bpmn_models_metadata';
const BPMN_MODEL_XML_KEY_PREFIX = 'wfstudio_bpmn_';

// Helper to get metadata for all BPMN models
const getModelsMetadata = (): Omit<BpmnModel, 'xml'>[] => { // Adjusted to reflect it stores metadata without full XML
  if (typeof window === 'undefined') return [];
  const item = window.localStorage.getItem(BPMN_MODELS_METADATA_KEY);
  try {
    // Ensure dates are parsed correctly if stored as strings
    const models = item ? JSON.parse(item) : [];
    return models.map((model: any) => ({
      ...model,
      createdAt: model.createdAt ? new Date(model.createdAt) : new Date(),
      updatedAt: model.updatedAt ? new Date(model.updatedAt) : new Date(),
    }));
  } catch (e) {
    console.error(`Error parsing localStorage key ${BPMN_MODELS_METADATA_KEY}:`, e);
    return [];
  }
};

// Helper to save metadata for all BPMN models
const setModelsMetadata = (metadata: Omit<BpmnModel, 'xml'>[]): void => { // Adjusted to reflect it stores metadata without full XML
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

// Versioning constants and types
const BPMN_MODEL_VERSIONS_KEY_PREFIX = 'wfstudio_bpmn_versions_';

export interface ModelVersion {
  version: number;
  xml: string;
  savedAt: Date;
}

// Helper to get version history for a specific process
const getModelVersions = (processId: string): ModelVersion[] => {
  if (typeof window === 'undefined') return [];
  const item = window.localStorage.getItem(`${BPMN_MODEL_VERSIONS_KEY_PREFIX}${processId}`);
  try {
    const versions = item ? JSON.parse(item) : [];
    return versions.map((v: any) => ({
      ...v,
      savedAt: new Date(v.savedAt), // Ensure savedAt is a Date object
    }));
  } catch (e) {
    console.error(`Error parsing localStorage key ${BPMN_MODEL_VERSIONS_KEY_PREFIX}${processId}:`, e);
    return [];
  }
};

// Helper to save version history for a specific process
const setModelVersions = (processId: string, versions: ModelVersion[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${BPMN_MODEL_VERSIONS_KEY_PREFIX}${processId}`, JSON.stringify(versions));
  } catch (e) {
    console.error(`Error setting localStorage key ${BPMN_MODEL_VERSIONS_KEY_PREFIX}${processId}:`, e);
  }
};

// Helper to remove BPMN XML for a specific process
const removeModelXml = (processId: string): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(`${BPMN_MODEL_XML_KEY_PREFIX}${processId}`);
  // Also remove versions when the model's XML is removed
  window.localStorage.removeItem(`${BPMN_MODEL_VERSIONS_KEY_PREFIX}${processId}`);
};


class ModelStorageService {
  // Obter todos os metadados dos modelos, opcionalmente filtrados por processId
  async getModels(processId?: string): Promise<Omit<BpmnModel, 'xml'>[]> {
    let metadata = getModelsMetadata();
    if (processId) {
      metadata = metadata.filter(m => m.processId === processId);
    }
    return metadata.map(({ ...rest }) => rest); // Exclude XML from list view
  }

  // Obter um modelo específico, incluindo seu XML
  async getModel(id: string): Promise<BpmnModel | null> {
    const metadata = getModelsMetadata().find(m => m.id === id);
    if (!metadata) return null;

    const xml = getModelXml(metadata.processId); // processId should be valid here
    if (xml === null) {
        console.error(`XML for model ${id} (process ${metadata.processId}) not found, though metadata exists.`);
        return { ...metadata, xml: '', createdAt: new Date(metadata.createdAt), updatedAt: new Date(metadata.updatedAt) }; // Ensure dates are Date objects
    }
    return { ...metadata, xml, createdAt: new Date(metadata.createdAt), updatedAt: new Date(metadata.updatedAt) }; // Ensure dates are Date objects
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
        // If model for processId exists, update it.
        // Pass the full modelData which includes XML for versioning.
        return this.updateModel(existingModelForProcess.id, {
            name: modelData.name,
            xml: modelData.xml,
            description: modelData.description,
            tags: modelData.tags,
            processId: modelData.processId, // Should be the same if found by processId
        });
    }

    const newModelMetadata: Omit<BpmnModel, 'xml'> = { // Explicitly Omit 'xml'
      id: generateId(),
      name: modelData.name,
      processId: modelData.processId,
      description: modelData.description || '',
      version: 1, // This 'version' in metadata can track metadata changes or overall model version.
                  // The XML content versioning is separate.
      createdAt: now,
      updatedAt: now,
      tags: modelData.tags || [],
    };

    setModelsMetadata([...metadataList, newModelMetadata]);
    setModelXml(newModelMetadata.processId, modelData.xml);

    // Create first version entry for the new model
    const currentVersions = getModelVersions(newModelMetadata.processId); // Should be empty
    const newVersionNumber = currentVersions.length > 0 ? Math.max(...currentVersions.map(v => v.version)) + 1 : 1;
    const newVersionEntry: ModelVersion = {
      version: newVersionNumber,
      xml: modelData.xml,
      savedAt: now,
    };
    setModelVersions(newModelMetadata.processId, [...currentVersions, newVersionEntry]);

    return { ...newModelMetadata, xml: modelData.xml };
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
    const updatedMetadataBase: Omit<BpmnModel, 'xml'> = {
      ...existingMetadata,
      name: updates.name !== undefined ? updates.name : existingMetadata.name,
      description: updates.description !== undefined ? updates.description : existingMetadata.description,
      tags: updates.tags !== undefined ? updates.tags : existingMetadata.tags,
      processId: updates.processId !== undefined ? updates.processId : existingMetadata.processId,
      updatedAt: new Date(),
      version: (existingMetadata.version || 0) + 1, // This is metadata version, not XML content version
    };

    const currentProcessIdForXml = updatedMetadataBase.processId;
    let finalXml = getModelXml(currentProcessIdForXml); // Get current XML before potential update

    // If processId changes, the old XML and its versions (associated with the old processId) are removed.
    // New versions will be associated with the new processId.
    if (updates.processId && updates.processId !== existingMetadata.processId) {
        removeModelXml(existingMetadata.processId); // Removes XML and its versions from old processId
        // Any existing XML for the *new* processId (if updates.xml is not set) would be loaded later.
        // If updates.xml is set, it becomes the XML for the new processId.
        finalXml = getModelXml(currentProcessIdForXml); // Re-fetch XML for the new processId if it exists
    }

    metadataList[modelIndex] = updatedMetadataBase;
    setModelsMetadata(metadataList);

    // Handle XML update and versioning:
    // This must happen *after* potential processId changes and metadata updates.
    if (updates.xml !== undefined) {
      setModelXml(currentProcessIdForXml, updates.xml); // Save the new XML as the current one
      finalXml = updates.xml; // The XML for the returned model is the updated one.

      // Create new version entry
      const currentVersions = getModelVersions(currentProcessIdForXml);
      const newVersionNumber = currentVersions.length > 0 ? Math.max(...currentVersions.map(v => v.version)) + 1 : 1;
      const newVersionEntry: ModelVersion = {
        version: newVersionNumber,
        xml: updates.xml, // The XML for this version is the one being saved
        savedAt: updatedMetadataBase.updatedAt, // Use the model's updatedAt timestamp
      };
      setModelVersions(currentProcessIdForXml, [...currentVersions, newVersionEntry]);
    }

    // If XML was not part of the update, ensure finalXml has a value (it might be null if new processId has no XML yet)
    finalXml = finalXml || "";


    return { ...updatedMetadataBase, xml: finalXml };
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
    const initialCount = metadataList.length;
    const updatedMetadataList = metadataList.filter(m => m.processId !== processId);

    if (updatedMetadataList.length < initialCount) {
      setModelsMetadata(updatedMetadataList);
    }
    // Always attempt to remove the XML for this processId, as it's keyed by processId.
    // removeModelXml already handles removing versions.
    removeModelXml(processId);
  }

  // Synchronous method to get models for a specific process, including XML
  getModelsForProcess(processId: string): BpmnModel[] {
    if (typeof window === 'undefined') return [];
    const metadataList = getModelsMetadata();
    const modelsForProcessMetadata = metadataList.filter(m => m.processId === processId);

    return modelsForProcessMetadata.map(metadata => {
      const xml = getModelXml(metadata.processId); // processId must be correct
      return { ...metadata, xml: xml || '', createdAt: new Date(metadata.createdAt), updatedAt: new Date(metadata.updatedAt) };
    });
  }

  // Synchronous method to get total count of all models
  getTotalModelsCount(): number {
    if (typeof window === 'undefined') return 0;
    const metadataList = getModelsMetadata();
    return metadataList.length;
  }

  // Exportar modelo como arquivo - This operates on client-side data
  exportModel(model: BpmnModel, format: 'bpmn' | 'json' = 'bpmn'): void {
    let content: string;
    let mimeType: string;
    let extension: string;

    if (format === 'bpmn') {
      content = model.xml;
      mimeType = 'application/xml';
      extension = 'bpmn';
    } else {
      const exportableModel = { ...model };
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
              xml: importedData.xml || '',
              processId: processId,
              description: importedData.description || '',
              tags: importedData.tags || []
            };
          } else { // Assuming .bpmn or .xml
            modelToSaveData = {
              name: file.name.replace(/\.(bpmn|xml)$/, ''),
              xml: content,
              processId: processId,
              description: 'Modelo importado de arquivo BPMN/XML',
              tags: ['importado']
            };
          }

          if (!modelToSaveData.xml) {
            throw new Error('Conteúdo XML do modelo não encontrado no arquivo importado.');
          }

          const modelsMetadata = getModelsMetadata();
          const existingModelMetadata = modelsMetadata.find(m => m.processId === processId);

          if (existingModelMetadata) {
            const updatedModel = await this.updateModel(existingModelMetadata.id, {
              name: modelToSaveData.name,
              xml: modelToSaveData.xml,
              description: modelToSaveData.description,
              tags: modelToSaveData.tags,
              // processId is not changed here as we found the model by it
            });
            if (!updatedModel) throw new Error('Failed to update existing model during import.');
            resolve(updatedModel);
          } else {
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

  // New versioning functions

  async listVersions(processId: string): Promise<ModelVersion[]> {
    return getModelVersions(processId);
  }

  async restoreVersion(processId: string, versionNumber: number): Promise<BpmnModel | null> {
    const versions = getModelVersions(processId);
    const versionToRestore = versions.find(v => v.version === versionNumber);

    if (!versionToRestore) {
      console.error(`Version ${versionNumber} for process ${processId} not found.`);
      return null;
    }

    const modelsMetadata = getModelsMetadata();
    // Assuming one model metadata per processId.
    // If this assumption is wrong, logic to find the 'correct' model id would be needed.
    const modelMetadata = modelsMetadata.find(m => m.processId === processId);

    if (!modelMetadata) {
      console.error(`Model metadata for process ${processId} not found when restoring version.`);
      // This scenario indicates a potential inconsistency (versions exist, but no parent model metadata).
      // For now, we cannot proceed with an update if we don't have a model ID.
      return null;
    }

    // Update the model with the XML from the restored version.
    // The updateModel method will handle saving the XML as current and creating a new version entry.
    return this.updateModel(modelMetadata.id, { xml: versionToRestore.xml });
  }
}

export const modelStorage = new ModelStorageService();

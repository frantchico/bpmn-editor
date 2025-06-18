// src/services/modelStorage.ts
import axios from 'axios';
import { BpmnModel } from '@/types'; // Assuming BpmnModel is { id: string, name: string, description?: string, xml: string, version: number, createdAt: Date, updatedAt: Date, tags?: string[] }

// Define the structure of the model as expected by/from the backend
interface BackendBpmnModel {
  id: string;
  name: string;
  xml: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

const API_BASE_URL = 'http://localhost:3000/api'; // Adjust if backend runs on a different port

// Helper to convert backend model to frontend BpmnModel
function backendToFrontendModel(backendModel: BackendBpmnModel): BpmnModel {
  return {
    ...backendModel,
    description: '', // Or fetch if backend adds it
    version: 1, // Or fetch if backend adds it
    createdAt: new Date(backendModel.createdAt),
    updatedAt: new Date(backendModel.updatedAt),
    tags: [], // Or fetch if backend adds it
  };
}

class ModelStorageService {
  // Obter todos os modelos
  async getModels(): Promise<BpmnModel[]> {
    try {
      const response = await axios.get<BackendBpmnModel[]>(`${API_BASE_URL}/models`);
      return response.data.map(backendToFrontendModel);
    } catch (error) {
      console.error('Error fetching models:', error);
      return []; // Return empty array or throw error
    }
  }

  // Obter modelo por ID
  async getModel(id: string): Promise<BpmnModel | null> {
    try {
      const response = await axios.get<BackendBpmnModel>(`${API_BASE_URL}/models/${id}`);
      return backendToFrontendModel(response.data);
    } catch (error) {
      console.error(`Error fetching model ${id}:`, error);
      // Handle 404 specifically if needed, axios throws for non-2xx
      return null;
    }
  }

  // Salvar novo modelo
  // Frontend's BpmnModel has more fields than backend expects for creation.
  // Backend expects { name: string, xml: string }
  async saveModel(modelData: Pick<BpmnModel, 'name' | 'xml' | 'description' | 'tags'>): Promise<BpmnModel> {
    try {
      const payload = { name: modelData.name, xml: modelData.xml };
      const response = await axios.post<BackendBpmnModel>(`${API_BASE_URL}/models`, payload);
      // The backend returns the full new model including id, createdAt, updatedAt
      return backendToFrontendModel(response.data);
    } catch (error) {
      console.error('Error saving model:', error);
      throw error; // Re-throw to be handled by caller
    }
  }

  // Atualizar modelo
  // Backend expects { name?: string, xml?: string }
  async updateModel(id: string, updates: Partial<Pick<BpmnModel, 'name' | 'xml'>>): Promise<BpmnModel | null> {
    try {
      const payload: { name?: string; xml?: string } = {};
      if (updates.name) payload.name = updates.name;
      if (updates.xml) payload.xml = updates.xml;

      if (Object.keys(payload).length === 0) {
        // If no updatable fields provided, perhaps fetch and return current model or handle as error
        const currentModel = await this.getModel(id);
        return currentModel;
      }

      const response = await axios.put<BackendBpmnModel>(`${API_BASE_URL}/models/${id}`, payload);
      return backendToFrontendModel(response.data);
    } catch (error) {
      console.error(`Error updating model ${id}:`, error);
      // Handle 404 specifically if needed
      return null;
    }
  }

  // Deletar modelo
  async deleteModel(id: string): Promise<boolean> {
    try {
      await axios.delete(`${API_BASE_URL}/models/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting model ${id}:`, error);
      return false;
    }
  }

  // Gerar ID único - No longer needed, backend handles ID generation
  // private generateId(): string { ... }

  // Modelos padrão para demonstração - Keep for now, but not primary source
  private getDefaultModels(): BpmnModel[] {
    const now = new Date()
    return [
      {
        id: 'local-1', // Distinguish from backend models
        name: 'Processo de Aprovação (Local)',
        description: 'Fluxo para aprovação de documentos e solicitações',
        xml: this.getDefaultBpmnXml('Processo de Aprovação (Local)'),
        version: 1,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        tags: ['aprovação', 'documentos']
      }
    // ... more local examples if needed
    ];
  }

  private getDefaultBpmnXml(processName: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" name="${processName}" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Início"/>
    </bpmn:process>
</bpmn:definitions>`;
  }

  // Exportar modelo como arquivo - This operates on client-side data, should be fine
  exportModel(model: BpmnModel, format: 'bpmn' | 'json' = 'bpmn'): void {
    let content: string;
    let mimeType: string;
    let extension: string;

    if (format === 'bpmn') {
      content = model.xml;
      mimeType = 'application/xml';
      extension = 'bpmn';
    } else {
      // For JSON export, we might want to use the frontend model structure
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
  // This needs to use the new saveModel which calls the backend
  async importModel(file: File): Promise<BpmnModel> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          let modelToSave: Pick<BpmnModel, 'name' | 'xml' | 'description' | 'tags'>;

          if (file.name.endsWith('.json')) {
            const importedData = JSON.parse(content); // Expects structure compatible with BpmnModel or parts of it
            modelToSave = {
              name: importedData.name || 'Modelo Importado (JSON)',
              xml: importedData.xml, // Crucial field
              description: importedData.description || '',
              tags: importedData.tags || []
            };
          } else { // Assuming .bpmn or .xml
            modelToSave = {
              name: file.name.replace(/\.(bpmn|xml)$/, ''),
              description: 'Modelo importado de arquivo BPMN/XML',
              xml: content,
              tags: ['importado']
            };
          }

          if (!modelToSave.xml) {
            throw new Error('Conteúdo XML do modelo não encontrado no arquivo importado.');
          }

          const savedModel = await this.saveModel(modelToSave);
          resolve(savedModel);
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

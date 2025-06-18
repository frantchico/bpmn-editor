import { BpmnModel, ModelVersion } from '@/types'

// Simulação de armazenamento local
class ModelStorageService {
  private readonly MODELS_KEY = 'bpmn_models'
  private readonly VERSIONS_KEY = 'bpmn_versions'

  // Obter todos os modelos
  getModels(): BpmnModel[] {
    const stored = localStorage.getItem(this.MODELS_KEY)
    return stored ? JSON.parse(stored) : this.getDefaultModels()
  }

  // Obter modelo por ID
  getModel(id: string): BpmnModel | null {
    const models = this.getModels()
    return models.find(model => model.id === id) || null
  }

  // Salvar modelo
  saveModel(model: Omit<BpmnModel, 'id' | 'createdAt' | 'updatedAt'>): BpmnModel {
    const models = this.getModels()
    const now = new Date()
    
    const newModel: BpmnModel = {
      ...model,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
      version: 1
    }

    models.push(newModel)
    localStorage.setItem(this.MODELS_KEY, JSON.stringify(models))
    
    // Salvar primeira versão
    this.saveVersion(newModel.id, newModel.xml, 'Versão inicial')
    
    return newModel
  }

  // Atualizar modelo
  updateModel(id: string, updates: Partial<BpmnModel>): BpmnModel | null {
    const models = this.getModels()
    const index = models.findIndex(model => model.id === id)
    
    if (index === -1) return null

    const currentModel = models[index]
    const updatedModel: BpmnModel = {
      ...currentModel,
      ...updates,
      updatedAt: new Date(),
      version: currentModel.version + 1
    }

    models[index] = updatedModel
    localStorage.setItem(this.MODELS_KEY, JSON.stringify(models))
    
    // Salvar nova versão se o XML foi alterado
    if (updates.xml && updates.xml !== currentModel.xml) {
      this.saveVersion(id, updates.xml, `Versão ${updatedModel.version}`)
    }
    
    return updatedModel
  }

  // Deletar modelo
  deleteModel(id: string): boolean {
    const models = this.getModels()
    const filteredModels = models.filter(model => model.id !== id)
    
    if (filteredModels.length === models.length) return false
    
    localStorage.setItem(this.MODELS_KEY, JSON.stringify(filteredModels))
    
    // Deletar versões relacionadas
    this.deleteModelVersions(id)
    
    return true
  }

  // Obter versões de um modelo
  getModelVersions(modelId: string): ModelVersion[] {
    const stored = localStorage.getItem(this.VERSIONS_KEY)
    const allVersions: ModelVersion[] = stored ? JSON.parse(stored) : []
    return allVersions.filter(version => version.modelId === modelId)
  }

  // Salvar versão
  private saveVersion(modelId: string, xml: string, comment?: string): ModelVersion {
    const versions = this.getModelVersions(modelId)
    const newVersion: ModelVersion = {
      id: this.generateId(),
      modelId,
      version: versions.length + 1,
      xml,
      createdAt: new Date(),
      comment
    }

    const allVersions = this.getAllVersions()
    allVersions.push(newVersion)
    localStorage.setItem(this.VERSIONS_KEY, JSON.stringify(allVersions))
    
    return newVersion
  }

  // Obter todas as versões
  private getAllVersions(): ModelVersion[] {
    const stored = localStorage.getItem(this.VERSIONS_KEY)
    return stored ? JSON.parse(stored) : []
  }

  // Deletar versões de um modelo
  private deleteModelVersions(modelId: string): void {
    const allVersions = this.getAllVersions()
    const filteredVersions = allVersions.filter(version => version.modelId !== modelId)
    localStorage.setItem(this.VERSIONS_KEY, JSON.stringify(filteredVersions))
  }

  // Gerar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Modelos padrão para demonstração
  private getDefaultModels(): BpmnModel[] {
    const now = new Date()
    return [
      {
        id: '1',
        name: 'Processo de Aprovação',
        description: 'Fluxo para aprovação de documentos e solicitações',
        xml: this.getDefaultBpmnXml('Processo de Aprovação'),
        version: 1,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 horas atrás
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        tags: ['aprovação', 'documentos']
      },
      {
        id: '2',
        name: 'Fluxo de Vendas',
        description: 'Processo completo de vendas desde lead até fechamento',
        xml: this.getDefaultBpmnXml('Fluxo de Vendas'),
        version: 2,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 dia atrás
        updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        tags: ['vendas', 'crm']
      },
      {
        id: '3',
        name: 'Processo de Onboarding',
        description: 'Integração de novos funcionários',
        xml: this.getDefaultBpmnXml('Processo de Onboarding'),
        version: 1,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        tags: ['rh', 'onboarding']
      }
    ]
  }

  // XML BPMN padrão
  private getDefaultBpmnXml(processName: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" name="${processName}" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Início">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Tarefa Principal">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Fim">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="99" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="185" y="142" width="24" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_1" bpmnElement="Task_1">
        <dc:Bounds x="270" y="77" width="100" height="80" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_1" bpmnElement="EndEvent_1">
        <dc:Bounds x="432" y="99" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="444" y="142" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="215" y="117" />
        <di:waypoint x="270" y="117" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="370" y="117" />
        <di:waypoint x="432" y="117" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
  }

  // Exportar modelo como arquivo
  exportModel(model: BpmnModel, format: 'bpmn' | 'json' = 'bpmn'): void {
    let content: string
    let mimeType: string
    let extension: string

    if (format === 'bpmn') {
      content = model.xml
      mimeType = 'application/xml'
      extension = 'bpmn'
    } else {
      content = JSON.stringify(model, null, 2)
      mimeType = 'application/json'
      extension = 'json'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${model.name.toLowerCase().replace(/\s+/g, '-')}.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Importar modelo de arquivo
  importModel(file: File): Promise<BpmnModel> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          
          if (file.name.endsWith('.json')) {
            // Importar de JSON
            const modelData = JSON.parse(content)
            const model = this.saveModel({
              name: modelData.name || 'Modelo Importado',
              description: modelData.description || '',
              xml: modelData.xml,
              tags: modelData.tags || []
            })
            resolve(model)
          } else {
            // Importar de BPMN XML
            const model = this.saveModel({
              name: file.name.replace(/\.(bpmn|xml)$/, ''),
              description: 'Modelo importado de arquivo BPMN',
              xml: content,
              tags: ['importado']
            })
            resolve(model)
          }
        } catch (error) {
          reject(new Error('Erro ao processar arquivo: ' + error))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'))
      }
      
      reader.readAsText(file)
    })
  }
}

export const modelStorage = new ModelStorageService()


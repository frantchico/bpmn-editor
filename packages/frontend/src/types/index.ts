// Tipos para modelos BPMN
export interface Project {
  id: string;
  name: string;
}

export interface Area {
  id: string;
  name: string;
  projectId: string;
}

export interface SubArea {
  id: string;
  name: string;
  areaId: string;
}

export interface Process {
  id: string;
  name: string;
  subAreaId: string; // Or areaId if Processes can be directly under Areas
}

export interface BpmnModel {
  id: string // This might be the processId if a process has one BPMN model
  name: string
  xml: string
  processId: string; // Link to the Process
  description?: string
  version?: number
  createdAt: Date
  updatedAt: Date
  tags?: string[]
}

// Tipos para versionamento
export interface ModelVersion {
  id: string
  modelId: string
  version: number
  xml: string
  createdAt: Date
  comment?: string
}

// Tipos para o editor BPMN
export interface BpmnEditorProps {
  modelId?: string
  initialXml?: string
  onSave?: (xml: string) => void
  onExport?: (xml: string, format: 'bpmn' | 'svg' | 'png') => void
}

// Tipos para propriedades de elementos BPMN
export interface ElementProperties {
  id: string
  name?: string
  documentation?: string
  [key: string]: any
}

// Tipos para o painel de propriedades
export interface PropertiesPanelProps {
  element: ElementProperties | null
  onUpdate: (properties: Partial<ElementProperties>) => void
}

// Tipos para navegação
export interface NavItem {
  label: string
  path: string
  icon?: string
}

// Tipos para notificações
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}


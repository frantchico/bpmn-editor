// Tipos para modelos BPMN
export interface Project {
  id: string;
  code: string; // Added
  name: string;
  description: string; // Added
  status: string; // Added
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Area {
  id: string;
  code: string; // Added
  name: string;
  description: string; // Added
  status: string; // Added
  projectId: string;
}

export interface SubArea {
  id: string;
  code: string; // Added
  name: string;
  description: string; // Added
  status: string; // Added
  areaId: string;
  projectId: string; // Added, assuming SubArea also needs a projectId for context
}

export interface Process {
  id: string;
  code: string; // Added
  name: string;
  description: string; // Added
  status: string; // Added
  subAreaId: string; // Changed from areaId
  model: string; // Added - XML of the BPMN diagram
  version?: number; // Added for model versioning
  updatedAt?: string; // Added, ISO date string for last update
  projectId?: string; // Added for context/denormalization
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

export interface GeneralStatistics {
  totalProjects: number;
  totalAreas: number;
  totalSubAreas: number;
  totalProcesses: number;
  totalModels: number;
}

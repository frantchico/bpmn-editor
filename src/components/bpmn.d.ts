// Tipos customizados para bpmn-js
declare module 'bpmn-js/lib/Modeler' {
  export default class BpmnModeler {
    constructor(options: {
      container: HTMLElement
      keyboard?: {
        bindTo?: Document | HTMLElement
      }
      [key: string]: any
    })

    importXML(xml: string): Promise<{ warnings: any[] }>
    saveXML(options?: { format?: boolean }): Promise<{ xml: string }>
    saveSVG(): Promise<{ svg: string }>
    get(service: string): any
    destroy(): void
  }
}

declare module 'bpmn-js/lib/Viewer' {
  export default class BpmnViewer {
    constructor(options: {
      container: HTMLElement
      [key: string]: any
    })

    importXML(xml: string): Promise<{ warnings: any[] }>
    get(service: string): any
    destroy(): void
  }
}

// Tipos para serviços do bpmn-js
interface EventBus {
  on(event: string, callback: (event: any) => void): void
  off(event: string, callback?: (event: any) => void): void
}

interface Selection {
  get(): any[]
  select(element: any): void
}

interface Modeling {
  updateProperties(element: any, properties: any): void
}

interface Canvas {
  zoom(level: number | 'fit-viewport'): void
  getContainer(): HTMLElement
}

// Extensão dos tipos globais
declare global {
  interface Window {
    bpmnModeler?: any
  }
}


import React, { useEffect, useRef, useState, useImperativeHandle } from 'react'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'
import type { BpmnEditorProps, ElementProperties } from '@/types'

// Define the handles exposed by useImperativeHandle
export interface BpmnEditorHandles {
  save: () => Promise<void>;
  export: (format: 'bpmn' | 'svg' | 'png') => Promise<void>;
  updateElementProperties: (properties: Partial<ElementProperties>) => void;
  getModeler: () => BpmnModeler | null;
  // Add other methods if exposed, e.g., for canvas manipulation
  // zoom: (step?: number) => void;
  // fitViewport: () => void;
}

// BPMN XML básico para inicializar o editor
const initialBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js" exporterVersion="18.6.2">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

export interface BpmnEditorComponentProps extends BpmnEditorProps {
  onElementSelect?: (element: ElementProperties | null) => void
}

const BpmnEditor = React.forwardRef<BpmnEditorHandles, BpmnEditorComponentProps>(
  (props, ref) => {
    const {
      modelId,
      initialXml = initialBpmnXml,
      onSave,
      onExport,
      onElementSelect
    } = props;
  const containerRef = useRef<HTMLDivElement>(null)
  const modelerRef = useRef<BpmnModeler | null>(null)
  const onElementSelectRef = useRef(onElementSelect)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Keep the ref updated if the prop changes
  useEffect(() => {
    onElementSelectRef.current = onElementSelect
  }, [onElementSelect])

  useEffect(() => {
    let mounted = true

    const initializeModeler = async () => {
      if (!containerRef.current || !mounted) return

      try {
        setIsLoading(true)
        setError(null)

        // Limpar modeler anterior se existir
        if (modelerRef.current) {
          try {
            modelerRef.current.destroy()
          } catch (err) {
            console.warn('Erro ao destruir modeler anterior:', err)
          }
        }

        if (!mounted) return

        // Check if containerRef.current is null
        if (!containerRef.current) {
          console.error('Failed to initialize BPMN editor: Container not found.')
          if (mounted) {
            setError('Failed to initialize BPMN editor: Container not found.')
            setIsLoading(false)
          }
          return
        }

        // Inicializar o modeler BPMN
        const modeler = new BpmnModeler({
          container: containerRef.current
        })

        modelerRef.current = modeler

        // Carregar o XML inicial
        await modeler.importXML(initialXml)

        if (!mounted) return

        // Configurar eventos
        const eventBus = modeler.get('eventBus')
        
        // Evento de seleção de elemento
        eventBus.on('selection.changed', (event: any) => {
          if (!mounted) return
          
          const { newSelection } = event
          if (newSelection.length > 0) {
            const element = newSelection[0]
            const businessObject = element.businessObject
            
            const elementProps: ElementProperties = {
              id: businessObject.id,
              name: businessObject.name || '',
              documentation: businessObject.documentation?.[0]?.text || ''
            }
            
            onElementSelectRef.current?.(elementProps)
          } else {
            onElementSelectRef.current?.(null)
          }
        })

        // Ajustar zoom para caber na tela
        const canvas = modeler.get('canvas')
        canvas.zoom('fit-viewport')

        if (mounted) {
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Erro ao carregar diagrama BPMN:', err)
        if (mounted) {
          setError(`Erro ao carregar o diagrama BPMN: ${err.message || err}`)
          setIsLoading(false)
        }
      }
    }

    initializeModeler()

    // Cleanup
    return () => {
      mounted = false
      if (modelerRef.current) {
        try {
          modelerRef.current.destroy()
        } catch (err) {
          console.warn('Erro ao destruir modeler:', err)
        }
        modelerRef.current = null
      }
    }
  }, [initialXml]) // onElementSelect is removed from dependencies

  const handleSave = async () => {
    if (!modelerRef.current) return

    try {
      const { xml } = await modelerRef.current.saveXML({ format: true })
      onSave?.(xml)
    } catch (err) {
      console.error('Erro ao salvar:', err)
      setError('Erro ao salvar o diagrama')
    }
  }

  const handleExport = async (format: 'bpmn' | 'svg' | 'png') => {
    if (!modelerRef.current) return

    try {
      if (format === 'bpmn') {
        const { xml } = await modelerRef.current.saveXML({ format: true })
        onExport?.(xml, format)
      } else if (format === 'svg') {
        const { svg } = await modelerRef.current.saveSVG()
        onExport?.(svg, format)
      }
    } catch (err) {
      console.error('Erro ao exportar:', err)
      setError('Erro ao exportar o diagrama')
    }
  }

  const updateElementProperties = (properties: Partial<ElementProperties>) => {
    if (!modelerRef.current) return

    try {
      const selection = modelerRef.current.get('selection')
      const modeling = modelerRef.current.get('modeling')
      const selectedElements = selection.get()

      if (selectedElements.length > 0) {
        const element = selectedElements[0]
        const updates: any = {}

        if (properties.name !== undefined) {
          updates.name = properties.name
        }

        if (properties.documentation !== undefined) {
          updates.documentation = properties.documentation ? [{ text: properties.documentation }] : []
        }

        modeling.updateProperties(element, updates)
      }
    } catch (err) {
      console.error('Erro ao atualizar propriedades:', err)
    }
  }

  // Expor métodos para o componente pai
  useImperativeHandle(ref, () => ({
    // Adicionar o containerRef para acesso externo se necessário
    // container: containerRef.current,
    // Adicionar o containerRef para acesso externo se necessário
    // container: containerRef.current,
    save: handleSave,
    export: handleExport,
    updateElementProperties,
    getModeler: () => modelerRef.current
  }))

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Erro</div>
          <div className="text-red-500 text-sm">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Recarregar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-white">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">Carregando editor BPMN...</div>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="h-full w-full"
        style={{ minHeight: '500px' }}
      />
    </div>
  )
});


const MemoizedBpmnEditor = React.memo(BpmnEditor);
MemoizedBpmnEditor.displayName = 'BpmnEditor';
export default MemoizedBpmnEditor;


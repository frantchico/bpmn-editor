import React, { useEffect, useRef, useState, useImperativeHandle } from 'react'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'
import type { BpmnEditorProps, ElementProperties } from '@/types'
import { modelStorage } from '@/services/modelStorage'
import toast from 'react-hot-toast';

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
  processId: string; // Added processId prop
  onElementSelect?: (element: ElementProperties | null) => void
}

const BpmnEditor = React.forwardRef<BpmnEditorHandles, BpmnEditorComponentProps>(
  (props, ref) => {
    const {
      processId, // Destructure processId
      modelId,
      initialXml: propInitialXml, // Rename to avoid conflict, use existing default for initialBpmnXml
      onSave,
      onExport,
      onElementSelect
    } = props;
  const containerRef = useRef<HTMLDivElement>(null)
  const modelerRef = useRef<BpmnModeler | null>(null)
  const onElementSelectRef = useRef(onElementSelect)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSavedXml, setLastSavedXml] = useState<string | null>(null); // State for last saved XML

  // Keep the ref updated if the prop changes
  useEffect(() => {
    onElementSelectRef.current = onElementSelect
  }, [onElementSelect])

  useEffect(() => {
    let mounted = true

    const initializeModelerWithProcessXml = async () => {
      if (!containerRef.current || !mounted) return;

      setIsLoading(true);
      setError(null);

      try {
        let xmlToLoad = propInitialXml || initialBpmnXml; // Default to prop or global default

        if (processId) {
          // console.log(`BpmnEditor: Loading XML for processId: ${processId}`);
          const loadedXml = await modelStorage.getModelXmlByProcessId(processId);
          if (loadedXml) {
            xmlToLoad = loadedXml;
            // console.log(`BpmnEditor: XML found for processId: ${processId}`);
          } else {
            // console.log(`BpmnEditor: No XML found for processId: ${processId}, using default/prop initial XML.`);
            // If no XML in storage for processId, use the initialBpmnXml as the base for a new model.
            xmlToLoad = initialBpmnXml;
          }
        } else {
          // console.log("BpmnEditor: No processId provided, using default/prop initial XML.");
        }

        if (modelerRef.current) {
          try {
            modelerRef.current.destroy();
          } catch (err) {
            console.warn('Erro ao destruir modeler anterior:', err);
          }
          modelerRef.current = null;
        }

        if (!mounted || !containerRef.current) return;

        const modeler = new BpmnModeler({
          container: containerRef.current,
        });
        modelerRef.current = modeler;

        requestAnimationFrame(async () => {
          if (!mounted || !modelerRef.current) {
            if (modelerRef.current) {
                try { modelerRef.current.destroy(); } catch(e) { console.warn("Error destroying modeler in RAF cleanup", e)}
            }
            return;
          }

          const modelerInstance = modelerRef.current;

          try {
            await modelerInstance.importXML(xmlToLoad);
            if (!mounted) return;
            setLastSavedXml(xmlToLoad); // Set lastSavedXml after successful import

            // Configurar eventos
            const eventBus = modelerInstance.get('eventBus')
            
            // Evento de seleção de elemento
            eventBus.on('selection.changed', (event: any) => {
              if (!mounted) return

              const { newSelection } = event
              if (newSelection.length > 0) {
                const element = newSelection[0]
                // console.log('Selected element type:', element.type, 'ID:', element.id);
                const businessObject = element.businessObject

                const elementName = businessObject.name || '(No name)';
                const elementDocumentation = businessObject.documentation?.[0]?.text || '(No documentation)';

                const elementProps: ElementProperties = {
                  id: businessObject.id,
                  name: elementName,
                  documentation: elementDocumentation
                }

                onElementSelectRef.current?.(elementProps)
              } else {
                onElementSelectRef.current?.(null)
              }
            })

            // Ajustar zoom para caber na tela
            const canvas = modelerInstance.get('canvas')
            canvas.zoom('fit-viewport')

            if (mounted) {
              setIsLoading(false);
            }
          } catch (err: any) {
            console.error('Erro ao carregar diagrama BPMN:', err);
            if (mounted) {
              setError(`Erro ao carregar o diagrama BPMN: ${err.message || String(err)}`);
              setIsLoading(false);
            }
          }
        });
      } catch (err: any) {
        console.error('Erro ao inicializar o modeler BPMN:', err);
        if (mounted) {
          setError(`Erro ao inicializar o modeler BPMN: ${err.message || String(err)}`);
          setIsLoading(false);
        }
      }
    };

    initializeModelerWithProcessXml();

    return () => {
      mounted = false;
      requestAnimationFrame(() => {
        if (modelerRef.current) {
            try {
                modelerRef.current.destroy();
            } catch (err) {
                console.warn('Erro ao destruir modeler na limpeza:', err);
            }
            modelerRef.current = null;
        }
      });
    };
  }, [processId, propInitialXml]);


  const handleSave = async () => {
    if (!modelerRef.current) {
      console.error('BpmnEditor: Modeler not available for saving.');
      setError('Não é possível salvar: Editor não inicializado.');
      return;
    }
    if (!processId) {
      console.error('BpmnEditor: processId not provided for saving.');
      const errMessage = 'Cannot save: Process ID is missing.';
      setError(errMessage);
      toast.error(errMessage);
      return;
    }

    try {
      const { xml: currentXml } = await modelerRef.current.saveXML({ format: true });

      // --- BPMN XML Validation Step ---
      let tempModeler: BpmnModeler | null = null;
      try {
        // Create a dummy div for the temporary modeler
        const dummyContainer = document.createElement('div');
        tempModeler = new BpmnModeler({ container: dummyContainer });
        await tempModeler.importXML(currentXml);
        // If importXML succeeds, XML is valid.
      } catch (validationError: any) {
        console.error("BPMN XML Validation Error:", validationError);
        toast.error(`Invalid BPMN XML. Please correct errors. ${validationError.message || ''}`, { duration: 5000 });
        if (tempModeler) {
          tempModeler.destroy();
        }
        return; // Do not proceed with saving
      } finally {
        if (tempModeler) {
          tempModeler.destroy();
        }
      }
      // --- End of BPMN XML Validation Step ---

      if (currentXml === lastSavedXml) {
        toast('No changes to save.', { icon: '🤷' });
        return;
      }

      const savedModel = await modelStorage.saveModel({
        processId,
        xml: currentXml, // Use currentXml here
        name: `Model for ${processId}`,
        description: `Saved at ${new Date().toISOString()}`,
        tags: [], // Default tags or allow configuration
      });

      if (savedModel) {
        setLastSavedXml(currentXml); // Update lastSavedXml after successful save
        const versions = await modelStorage.listVersions(processId);
        let message = `Model for ${processId} saved.`;
        if (versions.length > 0) {
          const latestVersion = versions.reduce((prev, current) => (prev.version > current.version) ? prev : current);
          message = `Model for ${processId} updated successfully (v${latestVersion.version})`;
        } else {
           // Fallback if versions array is empty, though saveModel should ensure a version.
          message = `Model for ${processId} saved successfully (v${savedModel.version})`;
        }
        toast.success(message);
      } else {
        // This case might not be reachable if saveModel always returns a model or throws.
        toast.error(`Failed to save model for ${processId}.`);
      }

      onSave?.(currentXml); // Pass currentXml to onSave callback
    } catch (err: any) {
      console.error('Erro ao salvar o modelo BPMN:', err);
      const errMessage = `Error saving diagram: ${err.message || String(err)}`;
      setError(errMessage);
      toast.error(errMessage);
    }
  };

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
          const moddle = modelerRef.current.get('moddle');
          updates.documentation = properties.documentation ? [moddle.create('bpmn:Documentation', { text: properties.documentation })] : [];
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


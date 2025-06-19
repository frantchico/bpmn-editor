import React, { useState, useRef, useEffect } from 'react' // Added useEffect
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Save, Download, Upload, Undo, Redo, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react' // Added AlertTriangle
import BpmnEditorWithRef from '@/components/BpmnEditorWithRef'
import PropertiesPanel from '@/components/PropertiesPanel'
import type { ElementProperties, Process } from '@/types' // Added Process type
import type { BpmnEditorHandles } from '@/components/BpmnEditor'
import { processService } from '@/services/processService' // Added processService
import toast from 'react-hot-toast'; // Added toast

const Editor: React.FC = () => {
  const { id: modelId } = useParams<{ id: string }>() // Renamed id to modelId for clarity
  const [selectedElement, setSelectedElement] = useState<ElementProperties | null>(null)
  // const [modelName, setModelName] = useState(modelId ? `Modelo ${modelId}` : 'Novo Modelo'); // Will be replaced by process.name
  const editorRef = useRef<BpmnEditorHandles>(null)

  const [process, setProcess] = useState<Process | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (modelId) {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedProcess = processService.getProcess(modelId);
        if (fetchedProcess) {
          setProcess(fetchedProcess);
        } else {
          setError(`Process with ID "${modelId}" not found.`);
          toast.error(`Process with ID "${modelId}" not found.`);
        }
      } catch (e: any) {
        console.error("Error fetching process data:", e);
        setError(`Failed to load process data: ${e.message || String(e)}`);
        toast.error(`Failed to load process data: ${e.message || String(e)}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("No Process ID provided in the URL.");
      toast.error("No Process ID provided in the URL.");
      setIsLoading(false);
    }
  }, [modelId]);


  // The handleSave in BpmnEditor now handles the actual saving via modelStorage.
  // This handleSave can be kept if Editor page needs to do something extra after BpmnEditor's onSave.
  const handleSavePropFromEditor = (xml: string) => {
    console.log('EditorPage: BpmnEditor onSave triggered. XML:', xml);
    // Potentially refresh related data or show additional notifications if needed.
    // The main save notification (success/failure) is handled within BpmnEditor.
  };

  const handleExport = (data: string, format: 'bpmn' | 'svg' | 'png') => {
    console.log('Exportando como:', format)
    const fileName = process?.name || modelId || 'model';
    
    // Criar download do arquivo
    const blob = new Blob([data], { 
      type: format === 'bpmn' ? 'application/xml' : 'image/svg+xml' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName.toLowerCase().replace(/\s+/g, '-')}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleElementSelect = (element: ElementProperties | null) => {
    setSelectedElement(element)
  }

  const handlePropertyUpdate = (properties: Partial<ElementProperties>) => {
    if (selectedElement && editorRef.current) {
      // Atualizar propriedades no editor
      editorRef.current.updateElementProperties(properties)
      
      // Atualizar estado local
      setSelectedElement(prev => prev ? { ...prev, ...properties } : null)
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.bpmn,.xml'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const xml = event.target?.result as string
          // Aqui recarregaríamos o editor com o novo XML
          console.log('Importando arquivo:', xml)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleToolbarSave = () => {
    editorRef.current?.save()
  }

  const handleToolbarExport = () => {
    editorRef.current?.export('bpmn')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold">Editor BPMN</h2>
            {isLoading && <span className="text-sm text-gray-500">- Loading process name...</span>}
            {error && <span className="text-sm text-red-500">- Error loading name</span>}
            {process && <span className="text-sm text-gray-500">- {process.name}</span>}
            {!process && !isLoading && !error && <span className="text-sm text-gray-500">- Untitled Process</span>}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" title="Desfazer" className={undefined}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Refazer" className={undefined}>
              <Redo className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <Button variant="ghost" size="sm" title="Diminuir zoom" className={undefined}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">100%</span>
            <Button variant="ghost" size="sm" title="Aumentar zoom" className={undefined}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <Button variant="outline" size="sm" onClick={handleImport} className={undefined}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleToolbarExport} className={undefined}            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button 
              size="sm"
              onClick={handleToolbarSave} className={undefined} variant={undefined}            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Canvas Principal */}
        <div className="flex-1 bg-gray-50">
          {isLoading && (
            <div className="flex items-center justify-center h-full">Loading editor...</div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-full p-4 text-red-600">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p>{error}</p>
              <p>Please check the process ID or try again later.</p>
            </div>
          )}
          {!isLoading && !error && modelId && (
            <Card className="h-full m-4">
              <CardContent className="h-full p-0">
                <BpmnEditorWithRef
                  ref={editorRef}
                  processId={modelId} // Pass modelId as processId
                  processName={process?.name} // Pass fetched process name
                  onSave={handleSavePropFromEditor} // Use the renamed handler
                  onExport={handleExport}
                  onElementSelect={handleElementSelect}
                  // Assuming BpmnEditorWithRef is a wrapper around the MemoizedBpmnEditor or similar
                  // and correctly passes these props down.
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Painel de Propriedades */}
        <div className="w-80 bg-white border-l border-gray-200">
          <div className="h-full m-4 ml-0">
            <PropertiesPanel
              element={selectedElement}
              onUpdate={handlePropertyUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Editor


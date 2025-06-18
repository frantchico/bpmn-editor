import React, { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Save, Download, Upload, Undo, Redo, ZoomIn, ZoomOut } from 'lucide-react'
import BpmnEditorWithRef from '@/components/BpmnEditorWithRef'
import PropertiesPanel from '@/components/PropertiesPanel'
import type { ElementProperties } from '@/types'
import type { BpmnEditorRef } from '@/components/BpmnEditorWithRef'

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [selectedElement, setSelectedElement] = useState<ElementProperties | null>(null)
  const [modelName, setModelName] = useState(id ? `Modelo ${id}` : 'Novo Modelo')
  const editorRef = useRef<BpmnEditorRef>(null)

  const handleSave = (xml: string) => {
    console.log('Salvando modelo:', xml)
    // Aqui implementaremos a lógica de salvamento
  }

  const handleExport = (data: string, format: 'bpmn' | 'svg' | 'png') => {
    console.log('Exportando como:', format)
    
    // Criar download do arquivo
    const blob = new Blob([data], { 
      type: format === 'bpmn' ? 'application/xml' : 'image/svg+xml' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${modelName.toLowerCase().replace(/\s+/g, '-')}.${format}`
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
            <span className="text-sm text-gray-500">- {modelName}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" title="Desfazer">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Refazer">
              <Redo className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <Button variant="ghost" size="sm" title="Diminuir zoom">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">100%</span>
            <Button variant="ghost" size="sm" title="Aumentar zoom">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleToolbarExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button 
              size="sm" 
              onClick={handleToolbarSave}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Canvas Principal */}
        <div className="flex-1 bg-gray-50">
          <Card className="h-full m-4">
            <CardContent className="h-full p-0">
              <BpmnEditorWithRef
                ref={editorRef}
                modelId={id}
                onSave={handleSave}
                onExport={handleExport}
                onElementSelect={handleElementSelect}
              />
            </CardContent>
          </Card>
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


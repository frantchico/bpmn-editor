import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Save, RefreshCw } from 'lucide-react'
import type { PropertiesPanelProps } from '@/types'

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ element, onUpdate }) => {
  const [localName, setLocalName] = useState('')
  const [localDocumentation, setLocalDocumentation] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  // Sincronizar com elemento selecionado
  useEffect(() => {
    if (element) {
      setLocalName(element.name || '')
      setLocalDocumentation(element.documentation || '')
      setHasChanges(false)
    }
  }, [element])

  const handleNameChange = (value: string) => {
    setLocalName(value)
    setHasChanges(true)
  }

  const handleDocumentationChange = (value: string) => {
    setLocalDocumentation(value)
    setHasChanges(true)
  }

  const handleSave = () => {
    if (element && hasChanges) {
      onUpdate({ 
        name: localName,
        documentation: localDocumentation 
      })
      setHasChanges(false)
    }
  }

  const handleReset = () => {
    if (element) {
      setLocalName(element.name || '')
      setLocalDocumentation(element.documentation || '')
      setHasChanges(false)
    }
  }

  const getElementType = (id: string) => {
    if (id.includes('StartEvent')) return 'Evento de Início'
    if (id.includes('EndEvent')) return 'Evento de Fim'
    if (id.includes('Task')) return 'Tarefa'
    if (id.includes('Gateway')) return 'Gateway'
    if (id.includes('SequenceFlow')) return 'Fluxo de Sequência'
    return 'Elemento BPMN'
  }

  const getElementColor = (id: string) => {
    if (id.includes('StartEvent')) return 'bg-green-100 text-green-800'
    if (id.includes('EndEvent')) return 'bg-red-100 text-red-800'
    if (id.includes('Task')) return 'bg-blue-100 text-blue-800'
    if (id.includes('Gateway')) return 'bg-yellow-100 text-yellow-800'
    if (id.includes('SequenceFlow')) return 'bg-gray-100 text-gray-800'
    return 'bg-purple-100 text-purple-800'
  }

  if (!element) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            Propriedades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <RefreshCw className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-sm text-gray-500">
              Selecione um elemento no diagrama para editar suas propriedades
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          Propriedades
          {hasChanges && (
            <Badge variant="secondary" className="ml-auto">
              Modificado
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className={getElementColor(element.id)}>
            {getElementType(element.id)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informações básicas */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="element-name" className="text-sm font-medium">
              Nome
            </Label>
            <Input
              id="element-name"
              value={localName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Nome do elemento"
              className="text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="element-documentation" className="text-sm font-medium">
              Documentação
            </Label>
            <Textarea
              id="element-documentation"
              value={localDocumentation}
              onChange={(e) => handleDocumentationChange(e.target.value)}
              placeholder="Documentação do elemento"
              rows={3}
              className="text-sm resize-none"
            />
          </div>
        </div>

        <Separator />

        {/* Informações técnicas */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">ID do Elemento</Label>
            <Input
              value={element.id}
              disabled
              className="bg-gray-50 text-xs font-mono"
            />
          </div>
        </div>

        <Separator />

        {/* Ações */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSave}
            disabled={!hasChanges}
            size="sm"
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Aplicar
          </Button>
          <Button 
            onClick={handleReset}
            disabled={!hasChanges}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <Separator />

        {/* Propriedades avançadas */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">
            Propriedades Avançadas
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-2">
              Tipo de Elemento
            </div>
            <div className="text-sm font-medium">
              {getElementType(element.id)}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Propriedades específicas do tipo de elemento serão exibidas aqui conforme a seleção.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PropertiesPanel


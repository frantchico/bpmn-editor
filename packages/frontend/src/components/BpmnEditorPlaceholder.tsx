import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

const BpmnEditorPlaceholder: React.FC = () => {
  return (
    <div className="h-full w-full bg-white border-2 border-dashed border-gray-300 rounded-lg">
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🔧</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Editor BPMN em Desenvolvimento
          </h3>
          <p className="text-gray-500 mb-4 max-w-md">
            O editor BPMN está sendo implementado. A estrutura base da aplicação está completa 
            e funcional, incluindo navegação, layout responsivo e componentes principais.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-blue-800 mb-2">Funcionalidades Implementadas:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ Layout responsivo e navegação</li>
              <li>✅ Dashboard com métricas</li>
              <li>✅ Página de gerenciamento de modelos</li>
              <li>✅ Estrutura do editor com toolbar</li>
              <li>✅ Painel de propriedades</li>
              <li>🔄 Integração BPMN-JS (em progresso)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BpmnEditorPlaceholder


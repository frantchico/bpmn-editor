import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Plus, FileText, Download, Edit, Trash2, Upload } from 'lucide-react'
import { modelStorage } from '@/services/modelStorage'
import type { BpmnModel } from '@/types'

const Models: React.FC = () => {
  const [models, setModels] = useState<BpmnModel[]>([])
  const [filteredModels, setFilteredModels] = useState<BpmnModel[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadModels()
  }, [])

  useEffect(() => {
    // Filtrar modelos baseado no termo de busca
    const filtered = models.filter(model =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredModels(filtered)
  }, [models, searchTerm])

  const loadModels = () => {
    const allModels = modelStorage.getModels()
    setModels(allModels)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este modelo?')) {
      modelStorage.deleteModel(id)
      loadModels()
    }
  }

  const handleExport = (model: BpmnModel) => {
    modelStorage.exportModel(model, 'bpmn')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.bpmn,.xml,.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          await modelStorage.importModel(file)
          loadModels()
        } catch (error) {
          alert('Erro ao importar arquivo: ' + error)
        }
      }
    }
    input.click()
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modelos BPMN</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os seus modelos de processo</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleImport} className={undefined} size={undefined}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Link to="/editor">
            <Button className={undefined} variant={undefined} size={undefined}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Modelo
            </Button>
          </Link>
        </div>
      </div>

      <Card className={undefined}>
        <CardHeader className={undefined}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={undefined}>Biblioteca de Modelos</CardTitle>
              <CardDescription className={undefined}>
                {filteredModels.length} modelo{filteredModels.length !== 1 ? 's' : ''} encontrado{filteredModels.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar modelos..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e: { target: { value: React.SetStateAction<string> } }) => setSearchTerm(e.target.value)} type={undefined}                />
              </div>
              <Button variant="outline" size="sm" className={undefined}>
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={undefined}>
          {filteredModels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map((model) => (
                <Card key={model.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <Badge variant="secondary" className={undefined}>v{model.version}</Badge>
                    </div>
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {model.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {model.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Atualizado em {formatDate(model.updatedAt)}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExport(model)}
                            title="Exportar" className={undefined}                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(model.id)}
                            title="Deletar" className={undefined}                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Link to={`/editor/${model.id}`}>
                          <Button size="sm" className={undefined} variant={undefined}>
                            <Edit className="h-4 w-4 mr-1" />
                            Abrir
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {searchTerm ? (
                <div>
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Nenhum modelo encontrado</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Tente ajustar os termos de busca ou criar um novo modelo
                  </p>
                </div>
              ) : (
                <div>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Nenhum modelo encontrado</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Comece criando seu primeiro modelo BPMN ou importe um existente
                  </p>
                </div>
              )}
              <div className="flex items-center justify-center space-x-2">
                <Button onClick={handleImport} variant="outline" className={undefined} size={undefined}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Modelo
                </Button>
                <Link to="/editor">
                  <Button className={undefined} variant={undefined} size={undefined}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Modelo
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Models


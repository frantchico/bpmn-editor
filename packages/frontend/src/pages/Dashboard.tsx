import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Clock, Users } from 'lucide-react'
import { modelStorage } from '@/services/modelStorage'
import type { BpmnModel } from '@/types'

const Dashboard: React.FC = () => {
  const [models, setModels] = useState<BpmnModel[]>([])
  const [stats, setStats] = useState({
    totalModels: 0,
    recentModels: 0,
    collaborators: 8
  })

  useEffect(() => {
    const loadData = async () => {
      const fetchedModels = await modelStorage.getModels();
      const allModels = Array.isArray(fetchedModels) ? fetchedModels : [];
      setModels(allModels);
      
      // Calcular estatísticas
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentModelsCount = allModels.filter(model =>
        new Date(model.updatedAt) > oneWeekAgo
      ).length;

      setStats({
        totalModels: allModels.length,
        recentModels: recentModelsCount,
        collaborators: 8
      });
    };

    loadData();
  }, []);

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - d.getTime())
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffHours < 24) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`
    } else {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Gerencie seus modelos BPMN</p>
        </div>
        <Link to="/editor">
          <Button className={undefined} variant={undefined} size={undefined}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Modelo
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={undefined}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Modelos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className={undefined}>
            <div className="text-2xl font-bold">{stats.totalModels}</div>
            <p className="text-xs text-muted-foreground">
              Modelos armazenados
            </p>
          </CardContent>
        </Card>

        <Card className={undefined}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modelos Recentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className={undefined}>
            <div className="text-2xl font-bold">{stats.recentModels}</div>
            <p className="text-xs text-muted-foreground">
              Editados esta semana
            </p>
          </CardContent>
        </Card>

        <Card className={undefined}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className={undefined}>
            <div className="text-2xl font-bold">{stats.collaborators}</div>
            <p className="text-xs text-muted-foreground">
              Usuários ativos
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className={undefined}>
        <CardHeader className={undefined}>
          <CardTitle className={undefined}>Modelos Recentes</CardTitle>
          <CardDescription className={undefined}>
            Seus modelos BPMN editados recentemente
          </CardDescription>
        </CardHeader>
        <CardContent className={undefined}>
          <div className="space-y-4">
            {models.slice(0, 5).map((model) => (
              <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{model.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(model.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">v{model.version}</span>
                  <Link to={`/editor/${model.id}`}>
                    <Button variant="outline" size="sm" className={undefined}>Editar</Button>
                  </Link>
                </div>
              </div>
            ))}
            
            {models.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Nenhum modelo encontrado</p>
                <p className="text-sm mb-4">Comece criando seu primeiro modelo BPMN</p>
                <Link to="/editor">
                  <Button className={undefined} variant={undefined} size={undefined}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Modelo
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard


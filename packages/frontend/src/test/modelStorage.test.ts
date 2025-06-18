import { describe, it, expect, beforeEach } from 'vitest'
import { modelStorage } from '@/services/modelStorage'

describe('ModelStorage Service', () => {
  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorage.clear()
  })

  it('deve retornar modelos padrão quando localStorage está vazio', () => {
    const models = modelStorage.getModels()
    expect(models).toHaveLength(3)
    expect(models[0].name).toBe('Processo de Aprovação')
  })

  it('deve salvar um novo modelo', () => {
    const newModel = {
      name: 'Teste Modelo',
      description: 'Descrição de teste',
      xml: '<xml></xml>',
      tags: ['teste']
    }

    const savedModel = modelStorage.saveModel(newModel)
    
    expect(savedModel.id).toBeDefined()
    expect(savedModel.name).toBe('Teste Modelo')
    expect(savedModel.version).toBe(1)
    expect(savedModel.createdAt).toBeInstanceOf(Date)
  })

  it('deve atualizar um modelo existente', () => {
    const models = modelStorage.getModels()
    const firstModel = models[0]
    
    const updatedModel = modelStorage.updateModel(firstModel.id, {
      name: 'Nome Atualizado'
    })
    
    expect(updatedModel?.name).toBe('Nome Atualizado')
    expect(updatedModel?.version).toBe(firstModel.version + 1)
  })

  it('deve deletar um modelo', () => {
    const models = modelStorage.getModels()
    const firstModel = models[0]
    
    const deleted = modelStorage.deleteModel(firstModel.id)
    expect(deleted).toBe(true)
    
    const updatedModels = modelStorage.getModels()
    expect(updatedModels).toHaveLength(models.length - 1)
  })

  it('deve retornar null ao buscar modelo inexistente', () => {
    const model = modelStorage.getModel('id-inexistente')
    expect(model).toBeNull()
  })
})


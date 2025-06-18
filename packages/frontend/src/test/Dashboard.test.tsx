import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'

// Mock do serviço de storage
vi.mock('@/services/modelStorage', () => ({
  modelStorage: {
    getModels: () => [
      {
        id: '1',
        name: 'Teste Modelo',
        description: 'Modelo de teste',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        xml: '<xml></xml>',
        tags: ['teste']
      }
    ]
  }
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Dashboard', () => {
  it('deve renderizar o título corretamente', () => {
    renderWithRouter(<Dashboard />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('deve mostrar estatísticas de modelos', () => {
    renderWithRouter(<Dashboard />)
    expect(screen.getByText('Total de Modelos')).toBeInTheDocument()
    expect(screen.getAllByText('Modelos Recentes')[0]).toBeInTheDocument()
    expect(screen.getByText('Colaboradores')).toBeInTheDocument()
  })

  it('deve exibir botão para criar novo modelo', () => {
    renderWithRouter(<Dashboard />)
    expect(screen.getByText('Novo Modelo')).toBeInTheDocument()
  })
})


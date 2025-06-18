# Documentação Técnica - BPMN Modeler

## Arquitetura da Aplicação

### Visão Geral
A aplicação BPMN Modeler foi desenvolvida seguindo uma arquitetura modular e escalável, utilizando React com TypeScript como base. A estrutura foi projetada para facilitar manutenção, testes e futuras expansões.

### Stack Tecnológica

#### Frontend
- **React 19**: Framework principal para construção da interface
- **TypeScript**: Tipagem estática para maior robustez
- **Vite**: Build tool moderna e rápida
- **React Router v7**: Roteamento client-side
- **TailwindCSS**: Framework CSS utilitário
- **Radix UI**: Componentes primitivos acessíveis

#### Bibliotecas Específicas
- **bpmn-js**: Biblioteca oficial para manipulação de diagramas BPMN
- **Lucide React**: Ícones SVG otimizados
- **Axios**: Cliente HTTP para futuras integrações
- **date-fns**: Manipulação de datas

#### Desenvolvimento e Qualidade
- **Vitest**: Framework de testes
- **React Testing Library**: Testes de componentes
- **ESLint**: Análise estática de código
- **Prettier**: Formatação automática

### Padrões de Arquitetura

#### Estrutura de Pastas
```
src/
├── components/     # Componentes reutilizáveis
├── pages/         # Páginas/rotas da aplicação
├── services/      # Lógica de negócio e APIs
├── types/         # Definições TypeScript
├── utils/         # Funções utilitárias
├── hooks/         # Custom hooks React
└── test/          # Testes unitários
```

#### Separação de Responsabilidades
- **Componentes**: Apenas lógica de apresentação
- **Services**: Lógica de negócio e persistência
- **Types**: Contratos e interfaces
- **Utils**: Funções puras e helpers

## Componentes Principais

### Layout e Navegação

#### Layout.tsx
Componente wrapper principal que define a estrutura base da aplicação.

```typescript
interface LayoutProps {
  children: ReactNode
}
```

**Responsabilidades:**
- Renderização do header e sidebar
- Gerenciamento do layout responsivo
- Contexto global da aplicação

#### Header.tsx
Barra superior com navegação e ações globais.

**Funcionalidades:**
- Logo e branding
- Botões de ação rápida (Importar/Exportar)
- Menu de usuário (futuro)

#### Sidebar.tsx
Menu lateral com navegação principal.

**Funcionalidades:**
- Links para páginas principais
- Indicadores visuais de página ativa
- Design responsivo (collapsa em mobile)

### Páginas

#### Dashboard.tsx
Página inicial com visão geral dos modelos e estatísticas.

**Estado:**
```typescript
interface DashboardState {
  models: BpmnModel[]
  stats: {
    totalModels: number
    recentModels: number
    collaborators: number
  }
}
```

**Funcionalidades:**
- Carregamento dinâmico de estatísticas
- Lista de modelos recentes
- Navegação rápida para criação/edição

#### Models.tsx
Página de gerenciamento de modelos com funcionalidades CRUD.

**Estado:**
```typescript
interface ModelsState {
  models: BpmnModel[]
  filteredModels: BpmnModel[]
  searchTerm: string
}
```

**Funcionalidades:**
- Listagem com busca e filtros
- Importação/exportação de modelos
- Operações CRUD (Create, Read, Update, Delete)

#### Editor.tsx
Página do editor BPMN com toolbar e painel de propriedades.

**Estado:**
```typescript
interface EditorState {
  selectedElement: ElementProperties | null
  modelName: string
  isLoading: boolean
}
```

**Funcionalidades:**
- Interface do editor BPMN
- Toolbar com ações de edição
- Painel de propriedades
- Funcionalidades de salvar/exportar

### Componentes BPMN

#### BpmnEditor.tsx
Componente principal do editor BPMN integrado com bpmn-js.

**Props:**
```typescript
interface BpmnEditorProps {
  modelId?: string
  initialXml?: string
  onSave?: (xml: string) => void
  onExport?: (data: string, format: string) => void
  onElementSelect?: (element: ElementProperties | null) => void
}
```

**Funcionalidades:**
- Inicialização do modeler bpmn-js
- Eventos de seleção de elementos
- Métodos de salvamento e exportação

#### PropertiesPanel.tsx
Painel lateral para edição de propriedades de elementos BPMN.

**Props:**
```typescript
interface PropertiesPanelProps {
  element: ElementProperties | null
  onUpdate: (properties: Partial<ElementProperties>) => void
}
```

**Funcionalidades:**
- Edição de nome e documentação
- Propriedades específicas por tipo de elemento
- Validação de entrada

## Serviços

### ModelStorage Service

Serviço responsável pelo gerenciamento de modelos BPMN no localStorage.

#### Interface Principal
```typescript
class ModelStorageService {
  getModels(): BpmnModel[]
  getModel(id: string): BpmnModel | null
  saveModel(model: Omit<BpmnModel, 'id' | 'createdAt' | 'updatedAt'>): BpmnModel
  updateModel(id: string, updates: Partial<BpmnModel>): BpmnModel | null
  deleteModel(id: string): boolean
  exportModel(model: BpmnModel, format: 'bpmn' | 'json'): void
  importModel(file: File): Promise<BpmnModel>
}
```

#### Funcionalidades

**Persistência:**
- Armazenamento no localStorage
- Serialização/deserialização automática
- Dados padrão para demonstração

**Versionamento:**
- Incremento automático de versão
- Histórico de versões
- Comentários em alterações

**Importação/Exportação:**
- Suporte a formatos .bpmn, .xml e .json
- Download automático de arquivos
- Validação de formato

## Tipos TypeScript

### Modelos de Dados

#### BpmnModel
```typescript
interface BpmnModel {
  id: string
  name: string
  description?: string
  xml: string
  version: number
  createdAt: Date
  updatedAt: Date
  tags?: string[]
}
```

#### ModelVersion
```typescript
interface ModelVersion {
  id: string
  modelId: string
  version: number
  xml: string
  createdAt: Date
  comment?: string
}
```

#### ElementProperties
```typescript
interface ElementProperties {
  id: string
  name?: string
  documentation?: string
}
```

### Props de Componentes

#### BpmnEditorProps
```typescript
interface BpmnEditorProps {
  modelId?: string
  initialXml?: string
  onSave?: (xml: string) => void
  onExport?: (data: string, format: 'bpmn' | 'svg' | 'png') => void
  onElementSelect?: (element: ElementProperties | null) => void
}
```

#### PropertiesPanelProps
```typescript
interface PropertiesPanelProps {
  element: ElementProperties | null
  onUpdate: (properties: Partial<ElementProperties>) => void
}
```

## Configuração e Build

### Vite Configuration
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### TailwindCSS Configuration
```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cores customizadas
      }
    },
  },
  plugins: [],
}
```

## Testes

### Estratégia de Testes

#### Testes Unitários
- Componentes React com React Testing Library
- Serviços com mocks do localStorage
- Funções utilitárias isoladamente

#### Estrutura de Testes
```
src/test/
├── setup.ts              # Configuração global
├── Dashboard.test.tsx     # Testes do Dashboard
├── modelStorage.test.ts   # Testes do serviço
└── utils.test.ts          # Testes de utilitários
```

#### Exemplo de Teste
```typescript
describe('ModelStorage Service', () => {
  beforeEach(() => {
    localStorage.clear()
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
  })
})
```

## Docker e Deploy

### Dockerfile
```dockerfile
FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Performance e Otimizações

### Bundle Optimization
- Code splitting por rotas
- Lazy loading de componentes
- Tree shaking automático
- Minificação de assets

### Runtime Performance
- Memoização de componentes com React.memo
- useMemo para cálculos custosos
- useCallback para funções estáveis
- Debounce em campos de busca

### Caching Strategy
- Cache de assets estáticos (1 ano)
- Service Worker para cache offline (futuro)
- localStorage para dados de aplicação

## Segurança

### Client-Side Security
- Sanitização de inputs
- Validação de tipos TypeScript
- CSP headers via Nginx
- XSS protection headers

### Data Protection
- Dados armazenados localmente
- Sem transmissão de dados sensíveis
- Validação de arquivos importados

## Monitoramento e Logs

### Error Handling
```typescript
try {
  await modeler.importXML(xml)
} catch (error) {
  console.error('Erro ao carregar diagrama:', error)
  setError('Erro ao carregar o diagrama BPMN')
}
```

### Performance Monitoring
- Métricas de build (bundle size)
- Lighthouse scores
- Core Web Vitals

## Extensibilidade

### Plugin System (Futuro)
- Interface para plugins BPMN
- Hooks para extensão de funcionalidades
- API para componentes customizados

### API Integration
- Estrutura preparada para APIs REST
- Axios configurado para requisições
- Interceptors para autenticação

### Theming
- CSS custom properties
- TailwindCSS theme extension
- Dark mode support (futuro)

---

Esta documentação técnica serve como guia para desenvolvedores que trabalharão na manutenção e evolução da aplicação BPMN Modeler.


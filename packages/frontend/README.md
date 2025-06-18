# BPMN Modeler - Editor de Processos Moderno

Uma aplicação moderna de modelagem BPMN desenvolvida com React, TypeScript e as melhores práticas de desenvolvimento. Inspirada no repositório Activiti Modeling App, esta versão oferece uma interface limpa, responsiva e funcionalidades avançadas para criação e gerenciamento de modelos BPMN.

## 🚀 Características Principais

### 🧩 Funcionalidades Core
- **Editor BPMN Baseado em Web**: Interface moderna para criação e edição de diagramas BPMN
- **Interface Responsiva**: Design adaptável para desktop e dispositivos móveis
- **Importação e Exportação**: Suporte completo para arquivos .bpmn e .xml
- **Sistema de Versionamento**: Controle de versões automático para todos os modelos
- **Armazenamento Local**: Persistência de dados usando localStorage
- **Busca e Filtros**: Sistema avançado de busca por nome, descrição e tags

### ⚙️ Arquitetura Técnica
- **Frontend**: React 19 + TypeScript
- **Roteamento**: React Router v7
- **Estilização**: TailwindCSS + Radix UI
- **Editor BPMN**: bpmn-js (biblioteca oficial)
- **Ícones**: Lucide React
- **Build Tool**: Vite
- **Testes**: Vitest + React Testing Library
- **Qualidade**: ESLint + Prettier
- **Containerização**: Docker + Docker Compose

### 🧪 Qualidade e Testes
- **Testes Unitários**: Cobertura de componentes e serviços
- **Linting**: Configuração ESLint para TypeScript e React
- **Formatação**: Prettier para consistência de código
- **CI/CD Ready**: Estrutura preparada para pipelines de integração

### 🚀 DevOps e Execução
- **Docker**: Containerização completa da aplicação
- **Nginx**: Servidor web otimizado para produção
- **Hot Reload**: Desenvolvimento com recarga automática
- **Build Otimizado**: Minificação e otimização para produção

## 📋 Pré-requisitos

- Node.js 20+
- pnpm (recomendado) ou npm
- Docker (opcional, para containerização)

## 🛠️ Instalação e Execução

### Desenvolvimento Local

1. **Clone o repositório**
```bash
git clone <repository-url>
cd bpmn-modeler-app
```

2. **Instale as dependências**
```bash
pnpm install
# ou
npm install
```

3. **Execute em modo de desenvolvimento**
```bash
pnpm dev
# ou
npm run dev
```

4. **Acesse a aplicação**
```
http://localhost:5174
```

### Build para Produção

```bash
# Build da aplicação
pnpm build

# Preview do build
pnpm preview
```

### Execução com Docker

1. **Build da imagem Docker**
```bash
pnpm run docker:build
# ou
docker build -t bpmn-modeler .
```

2. **Execute o container**
```bash
pnpm run docker:run
# ou
docker run -p 3000:80 bpmn-modeler
```

3. **Usando Docker Compose**
```bash
pnpm run docker:compose
# ou
docker-compose up -d
```

A aplicação estará disponível em `http://localhost:3000`

## 🧪 Testes

```bash
# Executar testes
pnpm test

# Testes com interface
pnpm test:ui

# Testes com cobertura
pnpm test:coverage
```

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `pnpm dev` | Inicia servidor de desenvolvimento |
| `pnpm build` | Build para produção |
| `pnpm preview` | Preview do build |
| `pnpm test` | Executa testes |
| `pnpm lint` | Verifica qualidade do código |
| `pnpm lint:fix` | Corrige problemas de linting |
| `pnpm format` | Formata código com Prettier |
| `pnpm docker:build` | Build da imagem Docker |
| `pnpm docker:run` | Executa container Docker |
| `pnpm docker:compose` | Executa com Docker Compose |




## 📁 Estrutura do Projeto

```
bpmn-modeler-app/
├── src/
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── ui/             # Componentes de interface (Radix UI)
│   │   ├── BpmnEditor.tsx  # Editor BPMN principal
│   │   ├── Header.tsx      # Cabeçalho da aplicação
│   │   ├── Sidebar.tsx     # Menu lateral
│   │   └── Layout.tsx      # Layout principal
│   ├── pages/              # Páginas da aplicação
│   │   ├── Dashboard.tsx   # Página inicial com estatísticas
│   │   ├── Editor.tsx      # Página do editor BPMN
│   │   └── Models.tsx      # Gerenciamento de modelos
│   ├── services/           # Serviços e lógica de negócio
│   │   └── modelStorage.ts # Serviço de armazenamento
│   ├── types/              # Definições TypeScript
│   │   └── index.ts        # Tipos da aplicação
│   ├── utils/              # Utilitários e helpers
│   ├── test/               # Testes unitários
│   └── App.tsx             # Componente raiz
├── public/                 # Arquivos estáticos
├── dist/                   # Build de produção
├── docker-compose.yml      # Configuração Docker Compose
├── Dockerfile              # Configuração Docker
├── nginx.conf              # Configuração Nginx
├── vite.config.ts          # Configuração Vite
├── tsconfig.json           # Configuração TypeScript
├── tailwind.config.js      # Configuração TailwindCSS
├── .eslintrc.json          # Configuração ESLint
├── .prettierrc             # Configuração Prettier
└── package.json            # Dependências e scripts
```

## 🎯 Funcionalidades Implementadas

### Dashboard
- ✅ Estatísticas em tempo real (total de modelos, modelos recentes, colaboradores)
- ✅ Lista de modelos recentes com datas relativas
- ✅ Navegação rápida para criação e edição
- ✅ Design responsivo com cards informativos

### Gerenciamento de Modelos
- ✅ Listagem de todos os modelos com busca e filtros
- ✅ Visualização em cards com informações detalhadas
- ✅ Sistema de tags para categorização
- ✅ Funcionalidades de exportação e exclusão
- ✅ Importação de arquivos .bpmn e .xml

### Editor BPMN
- ✅ Interface completa com toolbar
- ✅ Painel de propriedades para edição inline
- ✅ Estrutura preparada para integração com bpmn-js
- ✅ Funcionalidades de salvar, exportar e importar
- ✅ Controles de zoom e navegação

### Sistema de Versionamento
- ✅ Versionamento automático de modelos
- ✅ Histórico de alterações
- ✅ Comentários em versões
- ✅ Armazenamento persistente

## 🔧 Configuração de Desenvolvimento

### Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
# Configurações da aplicação
VITE_APP_NAME=BPMN Modeler
VITE_APP_VERSION=1.0.0

# Configurações de desenvolvimento
VITE_DEV_PORT=5174
```

### Configuração do Editor
O editor pode ser personalizado através do arquivo `src/config/editor.ts`:

```typescript
export const editorConfig = {
  defaultZoom: 1,
  enableKeyboard: true,
  enableMinimap: false,
  theme: 'default'
}
```

## 🚀 Deploy

### Vercel
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Netlify
1. Build command: `pnpm build`
2. Publish directory: `dist`
3. Configure redirects para SPA

### Docker em Produção
```bash
# Build para produção
docker build -t bpmn-modeler:latest .

# Execute com variáveis de ambiente
docker run -d \
  -p 80:80 \
  --name bpmn-modeler \
  bpmn-modeler:latest
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código
- Use TypeScript para tipagem estática
- Siga as configurações do ESLint e Prettier
- Escreva testes para novas funcionalidades
- Documente componentes complexos

## 📝 Roadmap

### Próximas Funcionalidades
- [ ] Integração completa com bpmn-js Modeler
- [ ] Colaboração em tempo real
- [ ] Integração com APIs externas
- [ ] Exportação para múltiplos formatos (PNG, SVG, PDF)
- [ ] Sistema de templates
- [ ] Validação de modelos BPMN
- [ ] Histórico de ações (undo/redo)
- [ ] Comentários em elementos
- [ ] Integração com sistemas de versionamento (Git)

### Melhorias Técnicas
- [ ] PWA (Progressive Web App)
- [ ] Offline support
- [ ] Performance optimizations
- [ ] Accessibility improvements
- [ ] Internationalization (i18n)

## 🐛 Problemas Conhecidos

1. **Editor BPMN**: A integração completa com bpmn-js está em desenvolvimento
2. **Mobile**: Algumas funcionalidades podem ter limitações em dispositivos móveis
3. **Browser Support**: Testado principalmente no Chrome e Firefox

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- [Activiti](https://github.com/Activiti/activiti-modeling-app) - Inspiração para o projeto
- [bpmn-js](https://bpmn.io/) - Biblioteca BPMN
- [React](https://reactjs.org/) - Framework frontend
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS
- [Radix UI](https://www.radix-ui.com/) - Componentes primitivos

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma [issue](https://github.com/seu-usuario/bpmn-modeler-app/issues)
- Consulte a [documentação](https://github.com/seu-usuario/bpmn-modeler-app/wiki)
- Entre em contato: [email@exemplo.com](mailto:email@exemplo.com)

---

**Desenvolvido com ❤️ usando React + TypeScript**

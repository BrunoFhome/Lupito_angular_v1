# Lupito — Frontend

Interface web do sistema Lupito, uma plataforma de aprendizado com trilhas interativas, quadro Kanban e workspace de código integrado.

---

## Tecnologias

| Tecnologia | Versão | Finalidade |
|---|---|---|
| Angular | 17 | Framework SPA principal |
| TypeScript | 5.4 | Linguagem principal |
| Angular Material | 17 | Componentes de UI |
| Angular CDK | 17 | Primitivos de UI (drag, overlay) |
| Monaco Editor | 0.55 | Editor de código no workspace |
| ngx-monaco-editor-v2 | 17 | Integração do Monaco com Angular |
| RxJS | 7.8 | Programação reativa e chamadas HTTP |
| Angular Router | 17 | Roteamento client-side |
| Angular Forms | 17 | Formulários reativos e template-driven |
| Node.js / npm | — | Gerenciamento de pacotes |
| Angular CLI | 17 | Ferramenta de build e desenvolvimento |
| Karma + Jasmine | — | Testes unitários |

---

## Pré-requisitos

- Node.js 18+
- npm 9+
- Angular CLI 17: `npm install -g @angular/cli`
- Backend Lupito rodando em `http://localhost:8081`

---

## Instalação

```bash
# Instalar dependências
npm install
```

---

## Executando

```bash
# Modo desenvolvimento (live reload)
ng serve
# ou
npm start
```

A aplicação ficará disponível em: `http://localhost:4200`

```bash
# Build de produção
npm run build
```

Os arquivos gerados ficam em `dist/`.

---

## Configuração de Ambiente

As URLs da API são definidas em `src/environments/`:

**`environment.ts`** (desenvolvimento):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081'
};
```

**`environment.prod.ts`** (produção):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://sua-api-em-producao.com'
};
```

---

## Estrutura do Projeto

```
src/app/
├── app.routes.ts          # Definição de todas as rotas
├── app.config.ts          # Configuração global (providers, interceptors)
│
├── components/
│   └── navbar/            # Barra lateral de navegação
│
├── pages/
│   ├── login/             # Tela de login
│   ├── register/          # Tela de cadastro
│   ├── forgot-password/   # Solicitação de reset de senha
│   ├── reset-password/    # Redefinição de senha via token
│   ├── dashboard/         # Página inicial após login
│   ├── profile/           # Perfil do usuário
│   ├── aprendizado/       # Mapa da trilha de aprendizado
│   ├── lesson/            # Lição com teoria e exercícios
│   ├── kanban/            # Quadro Kanban de tarefas
│   └── workspace/         # Editor de código (Monaco Editor)
│
├── services/
│   ├── auth.service.ts        # Login, registro, token JWT
│   ├── learning.service.ts    # Cursos, lições, progresso
│   └── kanban.service.ts      # Tarefas do Kanban
│
└── guards/
    └── auth.guard.ts      # Proteção de rotas autenticadas
```

---

## Rotas

| Rota | Componente | Autenticação |
|---|---|---|
| `/login` | LoginComponent | Pública |
| `/register` | RegisterComponent | Pública |
| `/forgot-password` | ForgotPasswordComponent | Pública |
| `/reset-password` | ResetPasswordComponent | Pública |
| `/dashboard` | DashboardComponent | Requer login |
| `/profile` | ProfileComponent | Requer login |
| `/aprendizado` | AprendizadoComponent | Requer login |
| `/lesson/:id` | LessonComponent | Requer login |
| `/kanban` | KanbanComponent | Requer login |
| `/workspace/:taskId` | WorkspaceComponent | Requer login |
| `/**` | → dashboard | — |

O `AuthGuard` verifica se existe um token JWT válido no `localStorage` antes de permitir acesso às rotas protegidas.

---

## Funcionalidades

### Autenticação
- Login e cadastro com validação de formulário
- Token JWT armazenado no `localStorage`
- Redefinição de senha via link enviado por e-mail

### Trilha de Aprendizado (`/aprendizado`)
- Mapa visual em formato de cobra/zigzag com os módulos do curso
- Nós clicáveis que levam à lição correspondente
- Indicação visual de progresso (módulos concluídos)

### Lição (`/lesson/:id`)
- Conteúdo teórico do módulo
- Exercícios de múltipla escolha com feedback imediato
- Pontuação ao final

### Kanban (`/kanban`)
- Quadro com colunas: **A Fazer**, **Em Andamento**, **Em Revisão**, **Concluído**
- Movimentação de cards entre colunas com modal de confirmação
- Modal de auto-avaliação ao mover para "Em Revisão"
- Botão de acesso direto ao workspace de cada tarefa

### Workspace (`/workspace/:taskId`)
- Editor de código completo baseado no **Monaco Editor** (mesmo do VS Code)
- Instruções do desafio ao lado do editor
- Código inicial pré-carregado para cada lição
- Salvamento automático do código do usuário

### Perfil (`/profile`)
- Visualização e edição dos dados do usuário
- Exibição de sequência de estudos (streak)

---

## Paleta de Cores

| Variável | Hex | Uso |
|---|---|---|
| Primária | `#00dffc` | Destaques, bordas ativas |
| Primária escura | `#00b4cc` | Botões, cards ativos |
| Primária mais escura | `#008c9e` | Hover de botões |
| Fundo escuro | `#343838` | Navbar, textos de destaque |
| Mais escura | `#005f6b` | Gradientes, banners |

---

## Testes

```bash
# Executar testes unitários
npm test
# ou
ng test
```

Os testes usam **Karma** como runner e **Jasmine** como framework.

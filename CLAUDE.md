# CLAUDE.md — Lupito Workspace

Guia de contexto para o Claude Code neste workspace. Contém informações sobre ambos os projetos do sistema Lupito (TCC).

---

## Visao Geral do Projeto

**Lupito** e uma plataforma de aprendizado de programacao com trilhas interativas, quadro Kanban e workspace de codigo integrado. Desenvolvido como TCC (Trabalho de Conclusao de Curso).

O workspace tem dois projetos:

| Projeto | Diretorio | Descricao |
|---|---|---|
| Frontend | `c:/LUPITO-TCC/ws-spring-lupito/Lupito_angular_v1` | SPA Angular 17 |
| Backend | `c:/LUPITO-TCC/ws-spring-lupito/Lupito_v1` | API REST Spring Boot 4 |

---

## Frontend — `Lupito_angular_v1`

### Stack

- **Angular 17** (Standalone Components, sem NgModules)
- **TypeScript 5.4**
- **Angular Material 17** — componentes de UI
- **Angular CDK 17** — drag & drop, overlays
- **CodeMirror 6** — editor de codigo no workspace
- **RxJS 7.8** — reatividade e chamadas HTTP
- **Karma + Jasmine** — testes unitarios

### Como rodar

```bash
cd Lupito_angular_v1
npm install
ng serve         # http://localhost:4200
```

### Estrutura de pastas

```
src/app/
├── app.routes.ts          # Todas as rotas da aplicacao
├── app.config.ts          # Providers globais (HTTP, Router, Material)
├── components/
│   ├── navbar/            # Barra lateral de navegacao
│   └── toast/             # Notificacoes toast globais
├── pages/
│   ├── landing/           # Pagina publica inicial
│   ├── login/             # Login
│   ├── register/          # Cadastro
│   ├── forgot-password/   # Solicitar reset de senha
│   ├── reset-password/    # Redefinir senha via token
│   ├── dashboard/         # Home apos login
│   ├── profile/           # Perfil do usuario
│   ├── aprendizado/       # Mapa visual da trilha (cobra/zigzag)
│   ├── lesson/            # Licao com teoria e exercicios de multipla escolha
│   ├── kanban/            # Quadro Kanban (A Fazer / Em Andamento / Em Revisao / Concluido)
│   └── workspace/         # Editor de codigo (CodeMirror) com desafio ao lado
├── services/
│   ├── auth.service.ts    # Login, registro, JWT, perfil do usuario
│   ├── learning.service.ts# Cursos, licoes, progresso
│   └── kanban.service.ts  # Tarefas do Kanban
└── guards/
    └── auth.guard.ts      # Protecao de rotas — verifica token JWT no localStorage
```

### Rotas

| Rota | Componente | Autenticacao |
|---|---|---|
| `/` | LandingComponent | Publica |
| `/login` | LoginComponent | Publica |
| `/register` | RegisterComponent | Publica |
| `/forgot-password` | ForgotPasswordComponent | Publica |
| `/reset-password` | ResetPasswordComponent | Publica |
| `/dashboard` | DashboardComponent | Requer login |
| `/profile` | ProfileComponent | Requer login |
| `/aprendizado` | AprendizadoComponent | Requer login |
| `/lesson/:id` | LessonComponent | Requer login |
| `/kanban` | KanbanComponent | Requer login |
| `/workspace/:taskId` | WorkspaceComponent | Requer login |
| `/**` | redireciona para `/dashboard` | — |

### Autenticacao no frontend

- Token JWT armazenado no `localStorage` (chave: `token`)
- `AuthService.getCurrentUserId()` decodifica o payload do JWT para obter o `userId`
- Existe um `mockUser` estatico como fallback caso nao haja token (desenvolvimento)
- O `authGuard` bloqueia rotas protegidas e redireciona para `/login`

### Ambiente

`src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081'
};
```

### Paleta de cores (CSS variables)

| Variavel | Hex | Uso |
|---|---|---|
| Primaria | `#00dffc` | Destaques, bordas ativas |
| Primaria escura | `#00b4cc` | Botoes, cards ativos |
| Primaria mais escura | `#008c9e` | Hover de botoes |
| Fundo escuro | `#343838` | Navbar, textos de destaque |
| Mais escura | `#005f6b` | Gradientes, banners |

---

## Backend — `Lupito_v1`

### Stack

- **Java 25**
- **Spring Boot 4.0.3**
- **Spring Security** — autenticacao e autorizacao
- **Spring Data JPA + Hibernate** — ORM
- **PostgreSQL** — banco de dados
- **Flyway** — versionamento de migracoes
- **JWT (Auth0 java-jwt 4.4.0)** — tokens stateless
- **Spring Mail** — envio de e-mail (reset de senha)
- **Lombok** — reducao de boilerplate
- **Maven** — build e dependencias

### Como rodar

```bash
cd Lupito_v1
mvn spring-boot:run   # http://localhost:8081
```

Prerequisitos: PostgreSQL rodando localmente, banco `lupitov1` criado.

```sql
CREATE DATABASE lupitov1;
```

### Configuracao

`src/main/resources/application.properties` — configuracoes gerais:
- `server.port=8081`
- `spring.datasource.url=jdbc:postgresql://localhost:5432/lupitov1`
- `spring.datasource.username=postgres`
- JWT secret via env var `JWT_SECRET` (default dev: `lupito-dev-secret-change-in-production`)
- `app.frontend.url=http://localhost:4200` (usado no link de reset por e-mail)

`src/main/resources/application-local.properties` — credenciais sensiveis (NAO vai ao Git):
```properties
spring.mail.username=seu-email@gmail.com
spring.mail.password=sua-senha-de-app-gmail
```

### Estrutura de pacotes

```
src/main/java/com/bruno/lupito/
├── config/
│   ├── SecurityConfig.java     # Regras de seguranca, rotas publicas/protegidas
│   ├── SecurityFilter.java     # Filtro JWT — valida token em cada request
│   ├── TokenConfig.java        # Geracao e validacao de JWT
│   ├── AuthConfig.java         # PasswordEncoder (BCrypt), AuthenticationManager
│   ├── CorsConfig.java         # CORS liberado para http://localhost:4200
│   └── JWTUserData.java        # Record com dados do usuario extraidos do token
├── controller/
│   ├── AuthController.java         # /auth/*
│   ├── UserController.java         # /users/*
│   ├── LearningPathController.java # /learning/*
│   ├── KanbanController.java       # /kanban/*
│   ├── UserProgressController.java # /progress/*
│   └── GlobalExceptionHandler.java # Tratamento global de erros
├── services/
│   ├── UserService.java
│   ├── LearningPathService.java
│   ├── KanbanService.java
│   ├── UserProgressService.java
│   └── PasswordResetService.java
├── repository/         # Interfaces Spring Data JPA
├── entity/             # Entidades JPA mapeadas para o banco
└── dto/
    ├── request/        # Payloads de entrada (Login, Register, ForgotPassword, ResetPassword)
    └── response/       # Payloads de saida (LoginResponse, RegisterUserResponse)
```

### Endpoints principais

Todos os endpoints exceto `/auth/*` exigem header `Authorization: Bearer <token>`.

**Autenticacao** (`/auth`):
- `POST /auth/login` — retorna JWT
- `POST /auth/register` — cadastro
- `POST /auth/forgot-password` — envia e-mail de reset
- `POST /auth/reset-password` — redefine senha com token

**Usuario** (`/users`):
- `GET /users/{id}` — dados do usuario
- `PUT /users/{id}` — atualiza perfil

**Trilha de Aprendizado** (`/learning`):
- `GET /learning/courses` — lista cursos
- `GET /learning/course/{id}` — curso com secoes e licoes
- `GET /learning/lesson/{id}` — licao com exercicios

**Progresso** (`/progress`):
- `GET /progress/{courseId}` — progresso do usuario
- `POST /progress/advance` — avanca para proxima licao

**Kanban** (`/kanban`):
- `GET /kanban/tasks` — lista tarefas do usuario
- `POST /kanban/tasks` — cria tarefa
- `PUT /kanban/tasks/{id}` — atualiza tarefa (status, codigo, etc.)
- `DELETE /kanban/tasks/{id}` — remove tarefa

### Banco de dados (Flyway)

Migracoes em `src/main/resources/db/migration/`:

| Arquivo | Conteudo |
|---|---|
| `V1__create_schema.sql` | Criacao de todas as tabelas |
| `V2__seed_learning_content.sql` | 2 cursos, 7 secoes, 20 licoes, 60 exercicios |
| `V3__seed_kanban_templates.sql` | 20 templates Kanban com desafios de codigo |

### Modelo de dados (tabelas principais)

- `tb_users` — usuarios (id, name, email, password, bio, learning_progress, current_streak, last_study_date, city, state)
- `tb_courses` — cursos (id, title, description)
- `tb_sections` — secoes de um curso (id, title, list_order, course_id)
- `tb_lessons` — licoes de uma secao (id, title, theory_content, list_order, section_id)
- `tb_exercises` — exercicios de uma licao (id, question, correct_answer, lesson_id)
- `tb_exercises_options` — opcoes de multipla escolha de um exercicio
- `tb_user_progress` — progresso por usuario/curso (current_section_order, current_lesson_order)
- `tb_kanban_templates` — templates de tarefa Kanban vinculados a licoes (com starter_code e language)
- `tb_kanban_tasks` — tarefas Kanban do usuario (status, user_code, challenge_instructions)
- `password_reset_tokens` — tokens de reset de senha com expiracao

### Seguranca

- Autenticacao **stateless** via JWT
- Senhas com hash **BCrypt**
- CORS configurado para `http://localhost:4200`
- Reset de senha: token UUID com expiracao enviado por e-mail (Gmail SMTP com Senha de App)

---

## Relacionamento Frontend <-> Backend

```
Angular (porta 4200)  <--->  Spring Boot (porta 8081)
         |                          |
    localStorage               PostgreSQL
    (token JWT)               (lupitov1 DB)
```

- O frontend envia o JWT em cada request autenticado via header `Authorization: Bearer <token>`
- O `SecurityFilter` do backend valida o token e popula o `SecurityContext`
- O CORS esta configurado no backend para aceitar apenas `http://localhost:4200`

---

## Comandos rapidos

```bash
# Frontend
cd Lupito_angular_v1 && ng serve

# Backend
cd Lupito_v1 && mvn spring-boot:run

# Testes frontend
cd Lupito_angular_v1 && ng test

# Build frontend producao
cd Lupito_angular_v1 && npm run build
```

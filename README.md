# Projeto User API

API REST em Node.js / Express para gerenciar usuários, serviços e agendamentos, usando Prisma e PostgreSQL.

## Domínio e papéis

O domínio simula um sistema simples de agendamentos de serviços.

- **User**: cliente autenticado que agenda serviços.
- **Service**: tipo de serviço oferecido (exemplo: consulta, corte de cabelo).
- **Appointment**: agendamento de um serviço em um horário específico.

Papéis (RBAC):

- **admin**: gerencia usuários e serviços, vê todos os agendamentos.
- **operator**: gerencia serviços e confirma agendamentos.
- **user**: agenda serviços e gerencia apenas os próprios agendamentos.

### Fluxos de negócio

1. **Gestão de serviços (admin/operator)**  
   - Criar serviço (`POST /api/v1/services`)  
   - Listar serviços com paginação e filtro por nome (`GET /api/v1/services`)  
   - Atualizar serviço (`PUT /api/v1/services/{id}`)  
   - Excluir serviço (`DELETE /api/v1/services/{id}`)

2. **Agendamento de serviços (user + operator/admin)**  
   - Usuário lista serviços e escolhe um.  
   - Usuário agenda um horário para um serviço (`POST /api/v1/appointments`).  
   - A API calcula `endAt` com base em `durationMin`.  
   - A API impede conflitos de horário para o mesmo serviço (ignora cancelados).  
   - Operator/admin pode confirmar o agendamento (`POST /api/v1/appointments/{id}/confirm`).  
   - Dono ou operator/admin pode cancelar o agendamento (`POST /api/v1/appointments/{id}/cancel`).  
   - Dono só consegue ver/alterar os próprios agendamentos; admin/operator veem todos.

Regras de domínio importantes:

- Não é possível confirmar/cancelar agendamentos no passado.
- Não é possível confirmar um agendamento cancelado.
- Não é possível cancelar um agendamento que já está cancelado.
- A criação checa conflito de horário para o mesmo `serviceId` (start/end overlap).

---

## Estrutura de pastas

```text
src/
  app.ts             # monta routers e Swagger
  server.ts          # sobe servidor HTTP
  db.ts              # inicialização do Prisma
  auth/              # middlewares de autenticação (Auth0 e mock local)
  middlewares/       # RBAC, claims, etc.
  users/             # controller + router de usuários
  services/          # controller + router de serviços
  appointments/      # controller + router de agendamentos
prisma/
  schema.prisma      # modelos User, Service, Appointment
  migrations/        # migrações (se houver)
tests/
  *.test.ts          # testes unitários e E2E (Jest + Supertest)
infra/
  *.tf               # Terraform (ECR, ECS, ALB, RDS, IAM)
openapi.json         # contrato OpenAPI 3.0
docker-compose.yml   # sobe API + Postgres
Dockerfile

Variáveis de ambiente

Arquivo .env (desenvolvimento):

PORT=3001

# Banco principal (via Docker)
DATABASE_URL="postgresql://postgres:postgres@db:5432/userdb?schema=public"

# Banco de testes (acessado pela máquina host)
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5434/userdb_test?schema=public"

# Auth0 (produção)
JWT_ISSUER="https://SEU_DOMAIN.auth0.com/"
JWT_AUDIENCE="https://user-api"
JWKS_URI="https://SEU_DOMAIN.auth0.com/.well-known/jwks.json"

# CORS
CORS_ORIGIN=*

Arquivo .env.test (opcional, mas recomendado):

TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5434/userdb_test?schema=public"
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/userdb_test?schema=public"

Nos testes (NODE_ENV=test) a API usa TEST_DATABASE_URL e um middleware de JWT local (jwt.middleware.ts) com segredo SUPER_SECRET_LOCAL_KEY.

Em produção, a API usa jwt-auth0.middleware.ts, que valida JWT do Auth0 (iss, aud, exp, nbf) via JWKS.
Como rodar localmente (Node puro)

Pré-requisitos:

    Node 20+

    PostgreSQL rodando em localhost:5432 ou via Docker

Passos:

# instalar dependências
npm install

# gerar client do Prisma
npm run prisma:generate

# aplicar schema no banco de dev
npm run prisma:push

# subir servidor em dev (porta 3001 por padrão)
npm run dev

Swagger disponível em:

http://localhost:3001/api-docs

Como rodar com Docker Compose

# sobe API + banco
docker compose up -d --build

O banco fica disponível em db:5432 dentro da rede do compose, e mapeado para localhost:5434 na máquina host.

Se precisar reaplicar o schema com Prisma dentro do container da API:

docker compose exec api npx prisma db push

Banco de testes

Os testes E2E usam um banco separado userdb_test em localhost:5434.

Criar o banco de testes (uma vez só):

docker compose up -d db
docker compose exec db psql -U postgres -c "CREATE DATABASE userdb_test;"

Aplicar o schema no banco de testes:

DATABASE_URL="postgresql://postgres:postgres@localhost:5434/userdb_test?schema=public" npx prisma db push

Testes automatizados

Os testes são escritos com Jest + Supertest.

Rodar todos os testes:

npm test

O conjunto inclui:

    Users: RBAC, criação e listagem com admin/user.

    Appointments (unit): cálculo de endAt e conflito de horário.

    Appointments (E2E): fluxo “book / conflict / confirm / cancel” com banco real de teste.

    Database connectivity: conexão simples com Prisma no userdb_test.

Para o E2E funcionar, é necessário o banco userdb_test criado e acessível em localhost:5434 (como descrito acima).
Contrato da API (Swagger / OpenAPI)

O Swagger UI está disponível em:

http://localhost:3001/api-docs

O contrato em JSON está na raiz do projeto como openapi.json.

Principais endpoints (versão /api/v1):
Users

    GET /api/v1/users
    Lista usuários (somente admin).

    POST /api/v1/users
    Cria usuário (admin).

    GET /api/v1/users/{id}
    Retorna usuário. Usuário comum só acessa o próprio, admin pode acessar qualquer.

    PUT /api/v1/users/{id}
    Atualiza usuário. Usuário comum só atualiza o próprio, admin qualquer.

    DELETE /api/v1/users/{id}
    Remove usuário (somente admin).

Services

    GET /api/v1/services?page=&pageSize=&name=
    Lista serviços com paginação e filtro opcional por nome (contains, case insensitive).

    POST /api/v1/services
    Cria serviço (admin/operator).

    GET /api/v1/services/{id}
    Detalhe de serviço.

    PUT /api/v1/services/{id}
    Atualiza serviço (admin/operator).

    DELETE /api/v1/services/{id}
    Remove serviço (admin/operator).

Appointments

    GET /api/v1/appointments?page=&pageSize=&status=
    Lista agendamentos do usuário logado.
    Admin/operator podem ver todos.
    Filtro status aceita booked, confirmed, canceled ou scheduled (este último mapeado para booked).

    POST /api/v1/appointments
    Cria agendamento de serviço. Corpo:

    {
      "serviceId": "ID_DO_SERVICO",
      "startAt": "2025-12-01T10:00:00.000Z"
    }

    GET /api/v1/appointments/{id}
    Detalhe do agendamento (owner ou admin/operator).

    POST /api/v1/appointments/{id}/confirm
    Confirma agendamento (operator/admin).

    POST /api/v1/appointments/{id}/cancel
    Cancela agendamento (owner ou admin/operator).

Exemplos de chamadas com token local (teste)

Para uso local sem Auth0, existe o script generate-token.js, que gera um JWT compatível com o middleware de testes.

Gerar um token de admin:

node generate-token.js admin

Gerar um token de usuário comum:

node generate-token.js user

Usar o token em uma chamada curl (exemplo: listar serviços):

TOKEN="SEU_TOKEN_AQUI"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/services?page=1&pageSize=10

Criar um agendamento:

curl -X POST http://localhost:3001/api/v1/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "ID_DO_SERVICO",
    "startAt": "2025-12-01T10:00:00.000Z"
  }'

  Integrantes do grupo

    Esthevan Pereira

    Henrique Knack

    Isadora Santos da Silva
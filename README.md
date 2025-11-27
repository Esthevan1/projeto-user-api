# Projeto User API (Express + Prisma + Postgres)
## Tecnologias utilizadas
> Principais stacks e dependências empregadas no projeto.

- **Node.js + Express**
- **Prisma ORM**
- **PostgreSQL**
- **Auth0** (Client Credentials + RBAC)
- **Docker e Docker Compose**
- **Jest + Supertest**
- **Swagger (OpenAPI 3.0)**
- **Terraform + AWS ECS / ECR / RDS**

---

## Estrutura do projeto
> Organização dos diretórios principais do backend e da infraestrutura.

```

src/
├── auth/                  → Middlewares JWT e integração com Auth0
├── users/                 → Rotas e controladores de usuários
├── prisma/                → Configuração do ORM Prisma
├── swagger.ts             → Configuração da documentação OpenAPI
├── server.ts              → Inicialização da API
├── app.ts                 → Configuração principal do Express
└── tests/                 → Testes unitários e E2E
infra/
├── alb.tf                 → Load balancer AWS
├── ecs.tf                 → Configuração ECS Fargate
├── rds.tf                 → Banco de dados gerenciado
└── variables.tf           → Variáveis de ambiente Terraform

````

---

## Execução e Testes (Etapa 2)

### 🔧 Ambiente de execução
> O projeto pode ser rodado tanto localmente quanto via Docker, com variáveis de ambiente definidas em `.env`.

**Rodando localmente:**
```bash
cp .env.example .env
npm install
npm run dev
````

**Rodando via Docker:**

```bash
docker compose up -d --build
```

A API ficará disponível em:

* API: [http://localhost:3000](http://localhost:3000)
* Swagger: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

### Testes

> Os testes utilizam **Jest** e **Supertest**, com ambiente isolado via `TEST_DATABASE_URL`.

```bash
npm test
```

> Os testes cobrem:
>
> * Autenticação e RBAC (roles admin/user)
> * CRUD completo de `/users`
> * Integração com banco de dados Prisma

---

### Endpoints principais

> Rotas REST implementadas com seus respectivos métodos e descrições.

| Método | Rota         | Corpo                                   | Descrição                       |
| ------ | ------------ | --------------------------------------- | ------------------------------- |
| GET    | `/health`    | -                                       | Verifica se a API está online   |
| GET    | `/users`     | -                                       | Lista todos os usuários (admin) |
| GET    | `/users/:id` | -                                       | Retorna um usuário específico   |
| POST   | `/users`     | `{ "name": string, "email": string }`   | Cria um usuário (admin)         |
| PUT    | `/users/:id` | `{ "name"?: string, "email"?: string }` | Atualiza dados                  |
| DELETE | `/users/:id` | -                                       | Remove um usuário (admin)       |

---

### Deploy na AWS (Infra as Code com Terraform)

> O projeto possui infraestrutura declarada no diretório `/infra`, que automatiza criação de RDS, ECS, ECR e ALB.

```bash
# Build e push da imagem Docker
docker build -t projeto-user-api .
SHA=$(git rev-parse --short HEAD)
REPO="614077764783.dkr.ecr.eu-north-1.amazonaws.com/projeto-user-api-repo"
docker tag projeto-user-api:latest $REPO:$SHA
docker push $REPO:$SHA

# Aplicar infraestrutura
cd infra
terraform init
terraform apply -auto-approve -var "image_tag=$SHA"
```

---

### Verificação pós-deploy

> Após o Terraform aplicar a infraestrutura, teste se o serviço está respondendo.

```bash
ALB=$(terraform output -raw alb_dns)

# Health check
curl -i http://$ALB/health

# Listagem de usuários
curl -s http://$ALB/users
```

Se `/health` retornar `{"ok":true}` e `/users` listar registros, o deploy está validado.

---

### Documentação (Swagger)

> Documentação interativa para teste e visualização dos endpoints da API.

Disponível em:

* [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

Permite:

* Visualizar todos os endpoints `/users`
* Testar requisições com JWT
* Ver modelos `User` e `CreateUserInput`

---

### Autenticação (Auth0)

> O Auth0 é utilizado para emissão e verificação de tokens JWT (grant type `client_credentials`).

**Gerar token (Client Credentials):**

```bash
curl --request POST \
  --url https://dev-q4y887wpax47szdd.us.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "<CLIENT_ID>",
    "client_secret": "<CLIENT_SECRET>",
    "audience": "https://projeto-user-api",
    "grant_type": "client_credentials"
  }'
```

**Usar o token nos endpoints protegidos:**

```bash
curl -H "Authorization: Bearer <SEU_TOKEN>" http://localhost:3000/users
```

---

### Observabilidade e Logs

> Logs e monitoramento da execução dos containers no ECS via CloudWatch.

```bash
aws logs tail /ecs/projeto-user-api --since 10m --follow --region eu-north-1
```

---

### CI/CD

> O pipeline de integração contínua em `.github/workflows/ci.yml` executa:

* Lint + Build + Testes a cada push/PR
* Validação automática do Prisma Client
* Integração com o deploy AWS ECS

---

### Equipe

* Integrante 1: [Esthevan Pereira]
* Integrante 2: [Henrique Knack]
* Integrante 3: [Isadora Santos da Silva]


---

### Postman / Newman (Smoke)

Há uma coleção Postman em `postman/Projeto-User-API.postman_collection.json` e um ambiente em `postman/Projeto-User-API.postman_environment.json`.

Scripts disponíveis:

- `npm run smoke` — executa `newman` via `npx` (sem gerar relatórios).
- `npm run smoke:report` — executa um runner Node que chama `npx newman` e produz relatórios em `./reports` (`newman-report.html` e `newman-report.xml`).
- `npm run token:gen [role] [sub]` — gera um token JWT de teste (`role` = `admin`|`user`, `sub` opcional). Exemplo: `npm run token:gen admin test-user`.

Exemplo (PowerShell) para rodar a coleção localmente com token gerado automaticamente:

```powershell
# Gera token de admin e salva na variável TOKEN
 $TOKEN = npm run --silent token:gen admin | Out-String

# Executa a coleção e gera relatórios
 npm run smoke:report -- --env-var "token=$TOKEN"
```

Observações:

- A coleção possui scripts que salvam `serviceId` e `appointmentId` no ambiente para uso entre requisições.
- Garanta que a API esteja rodando (`npm run dev` ou via Docker) antes de executar o smoke.
- No CI, passe o token como variável segura e execute `npm run smoke:report -- --env-var "token=$TOKEN"`.


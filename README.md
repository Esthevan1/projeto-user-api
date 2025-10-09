#  User API (Express + Prisma + Postgres)

##  Requisitos
- **Docker** e **Docker Compose**
- (Opcional p/ rodar localmente) **Node 20 + npm**
- (Para deploy cloud) **AWS CLI + Terraform + credenciais configuradas**

---

## Rodando localmente com Docker
```bash
cp .env.example .env
# Portas padrão:
# - API: host 3001 -> container 3000
# - DB:  host 5434 -> container 5432
docker compose up -d --build
curl http://localhost:3001/health
```

---

##  Endpoints principais
| Método | Rota | Corpo | Descrição |
|---------|------|--------|------------|
| GET | `/health` | - | Verifica se a API está online |
| GET | `/users` | - | Lista todos os usuários |
| GET | `/users/:id` | - | Retorna um usuário específico |
| POST | `/users` | `{ "name": string, "email": string }` | Cria um usuário |
| PUT | `/users/:id` | `{ "name"?: string, "email"?: string }` | Atualiza dados |
| DELETE | `/users/:id` | - | Remove um usuário |

---

##  Desenvolvimento local (sem Docker)
```bash
npm ci
npx prisma generate
npm run prisma:push
npm run dev
```

---

##  Testes
```bash
# usa TEST_DATABASE_URL (veja .env.example)
npm test
```

---

##  Deploy em AWS ECS (Infra as Code com Terraform)
```bash
# 1. Build e push da imagem
docker build -t projeto-user-api .
SHA=$(git rev-parse --short HEAD)
REPO="614077764783.dkr.ecr.eu-north-1.amazonaws.com/projeto-user-api-repo"
docker tag projeto-user-api:latest $REPO:$SHA
docker push $REPO:$SHA

# 2. Aplicar infra e atualizar ECS
cd infra
terraform init
terraform apply -auto-approve -var "image_tag=$SHA"

# 3. Atualizar secret de conexão (caso altere senha do banco)
RDS=$(terraform output -raw rds_endpoint)
aws secretsmanager update-secret   --secret-id projeto-user-api/db_url   --secret-string 'postgresql://appuser:AppUser123!@'"$RDS"':5432/appdb?schema=public'   --region eu-north-1

# 4. Forçar novo deploy do container
aws ecs update-service   --cluster projeto-user-api-cluster   --service projeto-user-api-svc   --force-new-deployment   --region eu-north-1
```

---

##  Testes após deploy
```bash
ALB=$(terraform output -raw alb_dns)

# Health check
curl -i http://$ALB/health

# Lista usuários
curl -s http://$ALB/users

# Cria novo usuário
curl -s -X POST http://$ALB/users -H "Content-Type: application/json"   -d '{"name":"Bob","email":"bob@example.com"}'

# Confirma persistência
curl -s http://$ALB/users
```

✅ Se `/health` retornar `{"ok":true}` e `/users` listar registros, o deploy está 100%.

---

## Observabilidade
```bash
aws logs tail /ecs/projeto-user-api --since 10m --follow --region eu-north-1
```

---

## CI/CD
O workflow em `.github/workflows/ci.yml` executa:
- Lint + Build + Testes a cada push/PR
- Validação automática do Prisma Client

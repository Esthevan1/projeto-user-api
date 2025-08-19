# User API (Express + Prisma + Postgres)

## Requisitos
- Docker e Docker Compose
- (Opcional p/ rodar testes/local) Node 20 + npm

---

## Rodando com Docker
```bash
cp .env.example .env
# Portas padrão deste projeto:
# - API: host 3001 -> container 3000
# - DB:  host 5434 -> container 5432
docker compose up -d --build
curl http://localhost:3001/health
```

## Endpoints
- `GET /health`
- `GET /users`
- `GET /users/:id`
- `POST /users` `{ "name": string, "email": string }`
- `PUT /users/:id` `{ "name"?: string, "email"?: string }`
- `DELETE /users/:id`

## Desenvolvimento local (sem Docker)
```bash
npm ci
npx prisma generate
npm run prisma:push
npm run dev
```

## Testes
```bash
# usa TEST_DATABASE_URL (veja .env.example)
npm test
```

## CI
- Workflow em `.github/workflows/ci.yml` roda build + testes a cada push/PR.

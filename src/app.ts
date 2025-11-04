import express from "express";
import cors from "cors";
import { usersRouter } from "./users/users.router";
import { setupSwagger } from "./swagger";


export const app = express();

// ✅ Configuração de CORS baseada em variáveis de ambiente
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ✅ Health check público (sem autenticação)
app.get("/health", (_req, res) => res.json({ ok: true }));

setupSwagger(app); // ✅ habilita documentação e configuração de bearerAuth

// ✅ Users com RBAC definido em users.routes.ts
app.use("/users", usersRouter);

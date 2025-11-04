import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "./users.controller";

import { requireAuth0 } from "../auth/jwt-auth0.middleware";
import { requireAuth, requireRole } from "../auth/jwt.middleware";

const isTest = process.env.NODE_ENV === "test";

// ✅ Mock JWT no test / Auth0 no ambiente real
const authMiddleware = isTest ? requireAuth : requireAuth0;

export const usersRouter = Router();

// Rotas com RBAC
usersRouter.get("/", authMiddleware, requireRole("admin"), listUsers);
usersRouter.delete("/:id", authMiddleware, requireRole("admin"), deleteUser);

usersRouter.get("/:id", authMiddleware, requireRole("user"), getUser);
usersRouter.put("/:id", authMiddleware, requireRole("user"), updateUser);

usersRouter.post("/", authMiddleware, requireRole("admin"), createUser);

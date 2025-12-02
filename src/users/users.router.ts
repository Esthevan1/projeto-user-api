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
const authMiddleware = isTest ? requireAuth : requireAuth0;

export const usersRouter = Router();

/**
 * RBAC:
 * - Admin: pode tudo
 * - User: pode apenas ver e atualizar o próprio perfil
 */

// Somente admin pode listar todos os usuários
usersRouter.get("/", authMiddleware, requireRole("admin"), listUsers);

// Somente admin pode deletar qualquer usuário
usersRouter.delete("/:id", authMiddleware, requireRole("admin"), deleteUser);

// Usuário comum pode acessar o próprio perfil
usersRouter.get(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    const userId = req.params.id;
    const anyReq = req as any;
    const auth = anyReq.auth?.payload || anyReq.auth || anyReq.user;

    const roles: string[] =
      auth?.roles ||
      auth?.["https://projeto-user-api/roles"] ||
      [];

    if (auth?.sub === userId || roles.includes("admin")) {
      return next();
    }

    return res.status(403).json({ message: "Forbidden: not owner" });
  },
  getUser
);

// Usuário comum pode atualizar apenas o próprio perfil
usersRouter.put(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    const userId = req.params.id;
    const anyReq = req as any;
    const auth = anyReq.auth?.payload || anyReq.auth || anyReq.user;

    const roles: string[] =
      auth?.roles ||
      auth?.["https://projeto-user-api/roles"] ||
      [];

    if (auth?.sub === userId || roles.includes("admin")) {
      return next();
    }

    return res.status(403).json({ message: "Forbidden: not owner" });
  },
  updateUser
);

// Criação de usuário apenas para admin
usersRouter.post("/", authMiddleware, requireRole("admin"), createUser);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints para gerenciamento de usuários
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Lista todos os usuários
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *   post:
 *     summary: Cria um novo usuário (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Obtém um usuário pelo ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Atualiza um usuário existente
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Remove um usuário pelo ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       204:
 *         description: Usuário removido com sucesso
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */


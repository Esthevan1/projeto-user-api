import { Router } from "express";
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
} from "./services.controller";

import { requireAuth0 } from "../auth/jwt-auth0.middleware";
import { requireAuth, requireRole } from "../auth/jwt.middleware";

const isTest = process.env.NODE_ENV === "test";
const authMiddleware = isTest ? requireAuth : requireAuth0;

export const servicesRouter = Router();

// list: available to any authenticated user
servicesRouter.get("/", authMiddleware, listServices);
servicesRouter.get("/:id", authMiddleware, getService);

// admin only: manage services
servicesRouter.post("/", authMiddleware, requireRole("admin"), createService);
servicesRouter.put("/:id", authMiddleware, requireRole("admin"), updateService);
servicesRouter.delete("/:id", authMiddleware, requireRole("admin"), deleteService);

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Serviços que podem ser agendados
 */

/**
 * @swagger
 * /api/v1/services:
 *   get:
 *     summary: Lista serviços com paginação
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página (padrão 1)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Tamanho da página
 *     responses:
 *       200:
 *         description: Lista de serviços
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 *             examples:
 *               sampleList:
 *                 summary: Lista exemplo
 *                 value:
 *                   - id: "9fb4a812-3191-4d7a-8dff-92e0eff521f7"
 *                     name: "Corte de Cabelo"
 *                     description: "Corte clássico"
 *                     durationMin: 30
 *                     createdAt: "2025-11-27T18:00:00.000Z"
 *                     updatedAt: "2025-11-27T18:00:00.000Z"
 *                   - id: "a3b2c1d4-1111-2222-3333-444455556666"
 *                     name: "Barba"
 *                     description: "Aparar e modelar"
 *                     durationMin: 20
 *                     createdAt: "2025-11-20T10:00:00.000Z"
 *                     updatedAt: "2025-11-20T10:00:00.000Z"
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Cria um novo serviço (admin)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateServiceInput'
 *           examples:
 *             createService:
 *               summary: Exemplo de criação
 *               value:
 *                 name: "Corte de Cabelo"
 *                 description: "Corte clássico masculino"
 *                 durationMin: 30
 *     responses:
 *       201:
 *         description: Serviço criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *             examples:
 *               created:
 *                 summary: Serviço criado com sucesso
 *                 value:
 *                   id: "9fb4a812-3191-4d7a-8dff-92e0eff521f7"
 *                   name: "Corte de Cabelo"
 *                   description: "Corte clássico masculino"
 *                   durationMin: 30
 *                   createdAt: "2025-11-27T18:00:00.000Z"
 *                   updatedAt: "2025-11-27T18:00:00.000Z"
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/services/{id}:
 *   get:
 *     summary: Consulta um serviço por id
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Serviço encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 *
 *   put:
 *     summary: Atualiza um serviço (admin)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateServiceInput'
 *     responses:
 *       200:
 *         description: Serviço atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     summary: Remove um serviço (admin)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Serviço removido
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/services:
 *   get:
 *     summary: Lista serviços (paginado)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de serviços
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 */

/**
 * @swagger
 * /api/v1/services:
 *   post:
 *     summary: Cria um novo serviço (admin)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateServiceInput'
 *     responses:
 *       201:
 *         description: Serviço criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 */

export default servicesRouter;

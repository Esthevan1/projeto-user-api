import { Router } from "express";
import {
  listAppointments,
  getAppointment,
  createAppointment,
  confirmAppointment,
  cancelAppointment,
} from "./appointments.controller";

import { requireAuth0 } from "../auth/jwt-auth0.middleware";
import { requireAuth, requireRole } from "../auth/jwt.middleware";

const isTest = process.env.NODE_ENV === "test";
const authMiddleware = isTest ? requireAuth : requireAuth0;

export const appointmentsRouter = Router();

// list and get
appointmentsRouter.get("/", authMiddleware, listAppointments);
appointmentsRouter.get("/:id", authMiddleware, getAppointment);

// create: any authenticated user
appointmentsRouter.post("/", authMiddleware, createAppointment);

// confirm: operator or admin
appointmentsRouter.post("/:id/confirm", authMiddleware, requireRole("operator"), confirmAppointment);

// cancel: owner or operator/admin
appointmentsRouter.post("/:id/cancel", authMiddleware, cancelAppointment);

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Agendamentos de serviços
 */

/**
 * @swagger
 * /api/v1/appointments:
 *   get:
 *     summary: Lista agendamentos (admin/operator vê todos)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Tamanho da página
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Cria um novo agendamento (usuário autenticado)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAppointmentInput'
 *           examples:
 *             createAppointment:
 *               summary: Exemplo de criação de agendamento
 *               value:
 *                 serviceId: "9fb4a812-3191-4d7a-8dff-92e0eff521f7"
 *                 startAt: "2025-12-01T10:00:00.000Z"
 *     responses:
 *       201:
 *         description: Agendamento criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *             examples:
 *               created:
 *                 summary: Agendamento criado
 *                 value:
 *                   id: "b1c2d3e4-aaaa-bbbb-cccc-000011112222"
 *                   userId: "user-1"
 *                   serviceId: "9fb4a812-3191-4d7a-8dff-92e0eff521f7"
 *                   startAt: "2025-12-01T10:00:00.000Z"
 *                   endAt: "2025-12-01T10:30:00.000Z"
 *                   status: "booked"
 *                   createdAt: "2025-11-27T18:30:00.000Z"
 *                   updatedAt: "2025-11-27T18:30:00.000Z"
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflito de horário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               conflict:
 *                 summary: Time slot not available
 *                 value:
 *                   message: "Time slot not available"
 *
 * /api/v1/appointments/{id}:
 *   get:
 *     summary: Consulta um agendamento por id
 *     tags: [Appointments]
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
 *         description: Agendamento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/appointments/{id}/confirm:
 *   post:
 *     summary: Confirma um agendamento (operator/admin)
 *     tags: [Appointments]
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
 *         description: Agendamento confirmado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       404:
 *         $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/appointments/{id}/cancel:
 *   post:
 *     summary: Cancela um agendamento (owner ou operator/admin)
 *     tags: [Appointments]
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
 *         description: Agendamento cancelado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/appointments:
 *   post:
 *     summary: Agendar um serviço (usuário autenticado)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAppointmentInput'
 *     responses:
 *       201:
 *         description: Agendamento criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 */

/**
 * @swagger
 * /api/v1/appointments/{id}/confirm:
 *   post:
 *     summary: Confirma um agendamento (operator/admin)
 *     tags: [Appointments]
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
 *         description: Agendamento confirmado
 */

/**
 * @swagger
 * /api/v1/appointments/{id}/cancel:
 *   post:
 *     summary: Cancela um agendamento (owner/operator/admin)
 *     tags: [Appointments]
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
 *         description: Agendamento cancelado
 */

export default appointmentsRouter;

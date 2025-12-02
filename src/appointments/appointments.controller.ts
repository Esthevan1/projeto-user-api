import { Request, Response } from "express";
import { prisma } from "../db";
import { z } from "zod";

const createAppointmentBody = z
  .object({
    // aceita qualquer string não vazia (os testes usam algo tipo "service-1")
    serviceId: z.string().min(1),
    // scheduledFor: usado no contrato / OpenAPI / README
    scheduledFor: z.string().optional(),
    // startAt: mantido para compatibilidade com os testes existentes
    startAt: z.string().optional(),
  })
  .refine(
    (data) => !!data.scheduledFor || !!data.startAt,
    {
      message: "scheduledFor or startAt is required",
      path: ["scheduledFor"],
    }
  );

export async function listAppointments(req: Request, res: Response) {
  const page = Number(req.query.page || 1);
  const pageSize = Math.min(Number(req.query.pageSize || 20), 100);
  const skip = (page - 1) * pageSize;

  const auth = (req as any).auth || (req as any).user;
  const roles: string[] = auth?.roles || [];
  const isAdmin = roles.includes("admin") || roles.includes("operator");

  const where: any = {};
  if (!isAdmin) {
    where.userId = auth?.sub;
  }

  const rawStatus = (req.query.status as string | undefined)?.toLowerCase();
  if (rawStatus) {
    let mappedStatus: string | undefined;

    if (rawStatus === "scheduled") {
      mappedStatus = "booked";
    } else if (
      rawStatus === "booked" ||
      rawStatus === "confirmed" ||
      rawStatus === "canceled"
    ) {
      mappedStatus = rawStatus;
    }

    if (!mappedStatus) {
      return res.status(400).json({ message: "Invalid status filter" });
    }

    where.status = mappedStatus;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    skip,
    take: pageSize,
  });

  return res.json(appointments);
}

export async function getAppointment(req: Request, res: Response) {
  const { id } = req.params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  const auth = (req as any).auth || (req as any).user;
  const roles: string[] = auth?.roles || [];
  const isAdmin = roles.includes("admin") || roles.includes("operator");

  if (!isAdmin && auth?.sub !== appointment.userId) {
    return res.status(403).json({ message: "Forbidden: not owner" });
  }

  return res.json(appointment);
}

export async function createAppointment(req: Request, res: Response) {
  const parse = createAppointmentBody.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json(parse.error.flatten());
  }

  const auth = (req as any).auth || (req as any).user;
  const userId = auth?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { serviceId, scheduledFor, startAt } = parse.data;

  // usa scheduledFor se vier, senão usa startAt (para bater com os testes)
  const isoDate = scheduledFor ?? startAt!;
  const start = new Date(isoDate);

  if (Number.isNaN(start.getTime())) {
    return res.status(400).json({ message: "Invalid scheduled date" });
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    return res.status(400).json({ message: "Invalid serviceId" });
  }

  // fim = início + duração do serviço (em minutos)
  const end = new Date(start.getTime() + service.durationMin * 60 * 1000);

  // conflito de horário para o mesmo serviço, ignorando cancelados
  const conflict = await prisma.appointment.findFirst({
    where: {
      serviceId,
      status: { not: "canceled" },
      AND: [{ startAt: { lt: end } }, { endAt: { gt: start } }],
    },
  });

  if (conflict) {
    return res.status(409).json({ message: "Time slot not available" });
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId,
      serviceId,
      startAt: start,
      endAt: end,
      status: "booked",
    },
  });

  return res.status(201).json(appointment);
}

export async function confirmAppointment(req: Request, res: Response) {
  const { id } = req.params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  if (appointment.status === "canceled") {
    return res
      .status(400)
      .json({ message: "Cannot confirm a canceled appointment" });
  }

  const now = new Date();
  if (appointment.startAt.getTime() <= now.getTime()) {
    return res
      .status(400)
      .json({ message: "Cannot confirm appointments in the past" });
  }

  if (appointment.status === "confirmed") {
    return res.json(appointment);
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: "confirmed" },
  });

  return res.json(updated);
}

export async function cancelAppointment(req: Request, res: Response) {
  const { id } = req.params;

  const auth = (req as any).auth || (req as any).user;
  const roles: string[] = auth?.roles || [];
  const isAdmin = roles.includes("admin") || roles.includes("operator");

  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  if (!isAdmin && auth?.sub !== appointment.userId) {
    return res.status(403).json({ message: "Forbidden: not owner" });
  }

  if (appointment.status === "canceled") {
    return res
      .status(400)
      .json({ message: "Appointment is already canceled" });
  }

  const now = new Date();
  if (appointment.startAt.getTime() <= now.getTime()) {
    return res
      .status(400)
      .json({ message: "Cannot cancel appointments in the past" });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: "canceled" },
  });

  return res.json(updated);
}

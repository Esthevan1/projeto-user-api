import { Request, Response } from "express";
import { prisma } from "../db";
import { z } from "zod";
import { addMinutes } from "date-fns";

const createAppointmentBody = z.object({
  serviceId: z.string().uuid(),
  startAt: z.string(), // ISO datetime
});

export async function listAppointments(req: Request, res: Response) {
  const page = Number(req.query.page || 1);
  const pageSize = Math.min(Number(req.query.pageSize || 20), 100);
  const skip = (page - 1) * pageSize;

  // RBAC: admin/operator see all, user sees own
  const auth = (req as any).auth || (req as any).user;
  const roles: string[] = auth?.roles || [];
  const isAdmin = roles.includes("admin") || roles.includes("operator");

  const where: any = {};
  if (!isAdmin) {
    where.userId = auth?.sub;
  }

  const appointments = await prisma.appointment.findMany({ where, skip, take: pageSize });
  res.json(appointments);
}

export async function getAppointment(req: Request, res: Response) {
  const { id } = req.params;
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });

  const auth = (req as any).auth || (req as any).user;
  const roles: string[] = auth?.roles || [];
  const isAdmin = roles.includes("admin") || roles.includes("operator");
  if (!isAdmin && auth?.sub !== appointment.userId) {
    return res.status(403).json({ message: "Forbidden: not owner" });
  }

  res.json(appointment);
}

export async function createAppointment(req: Request, res: Response) {
  const parse = createAppointmentBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());

  const auth = (req as any).auth || (req as any).user;
  const userId = auth?.sub;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { serviceId, startAt } = parse.data;
  const start = new Date(startAt);

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return res.status(400).json({ message: "Invalid serviceId" });

  const end = addMinutes(start, service.durationMin);

  // conflict check: same service overlapping (exclude canceled)
  const conflict = await prisma.appointment.findFirst({
    where: {
      serviceId,
      status: { not: "canceled" },
      AND: [
        { startAt: { lt: end } },
        { endAt: { gt: start } },
      ],
    },
  });

  if (conflict) return res.status(409).json({ message: "Time slot not available" });

  const appointment = await prisma.appointment.create({
    data: {
      userId,
      serviceId,
      startAt: start,
      endAt: end,
      status: "booked",
    },
  });

  res.status(201).json(appointment);
}

export async function confirmAppointment(req: Request, res: Response) {
  const { id } = req.params;
  // only operator/admin can confirm any; users cannot confirm
  try {
    const appointment = await prisma.appointment.update({ where: { id }, data: { status: "confirmed" } });
    res.json(appointment);
  } catch {
    res.status(404).json({ message: "Appointment not found" });
  }
}

export async function cancelAppointment(req: Request, res: Response) {
  const { id } = req.params;
  const auth = (req as any).auth || (req as any).user;
  const roles: string[] = auth?.roles || [];
  const isAdmin = roles.includes("admin") || roles.includes("operator");

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });

  if (!isAdmin && auth?.sub !== appointment.userId) {
    return res.status(403).json({ message: "Forbidden: not owner" });
  }

  const updated = await prisma.appointment.update({ where: { id }, data: { status: "canceled" } });
  res.json(updated);
}

import { Request, Response } from "express";
import { prisma } from "../db";
import { z } from "zod";

const createServiceBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  durationMin: z.number().int().positive().optional(),
});

export async function listServices(req: Request, res: Response) {
  const page = Number(req.query.page || 1);
  const pageSize = Math.min(Number(req.query.pageSize || 20), 100);
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (typeof req.query.name === "string" && req.query.name.trim() !== "") {
    where.name = {
      contains: req.query.name.trim(),
      mode: "insensitive",
    };
  }

  const services = await prisma.service.findMany({
    where,
    skip,
    take: pageSize,
  });

  return res.json(services);
}

export async function getService(req: Request, res: Response) {
  const { id } = req.params;

  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    return res.status(404).json({ message: "Service not found" });
  }

  return res.json(service);
}

export async function createService(req: Request, res: Response) {
  const parse = createServiceBody.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json(parse.error.flatten());
  }

  const service = await prisma.service.create({
    data: parse.data,
  });

  return res.status(201).json(service);
}

export async function updateService(req: Request, res: Response) {
  const { id } = req.params;
  const parse = createServiceBody.partial().safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json(parse.error.flatten());
  }

  try {
    const service = await prisma.service.update({
      where: { id },
      data: parse.data,
    });

    return res.json(service);
  } catch (error) {
    return res.status(404).json({ message: "Service not found" });
  }
}

export async function deleteService(req: Request, res: Response) {
  const { id } = req.params;

  try {
    await prisma.service.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    return res.status(404).json({ message: "Service not found" });
  }
}

import { prisma } from "../db";
import { z } from "zod";
import { Request, Response } from "express";

const userBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany();
  res.json(users);
}

export async function getUser(req: Request, res: Response) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
}

export async function createUser(req: Request, res: Response) {
  const parse = userBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  const user = await prisma.user.create({ data: parse.data });
  res.status(201).json(user);
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const parse = userBody.partial().safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  try {
    const user = await prisma.user.update({ where: { id }, data: parse.data });
    res.json(user);
  } catch {
    res.status(404).json({ message: "User not found" });
  }
}
//testando
export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: "User not found" });
  }
}

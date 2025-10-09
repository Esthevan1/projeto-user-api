import { Router } from "express";
import { listUsers, getUser, createUser, updateUser, deleteUser } from "./users.controller";

export const usersRouter = Router();
usersRouter.get("/", listUsers);
usersRouter.get("/:id", getUser);
usersRouter.post("/", createUser);
usersRouter.put("/:id", updateUser);
usersRouter.delete("/:id", deleteUser);

import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/db";

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  await prisma.$connect();
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "User";');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "User" (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      name text NOT NULL,
      email text UNIQUE NOT NULL,
      "createdAt" timestamptz DEFAULT now(),
      "updatedAt" timestamptz DEFAULT now()
    );
  `);
});

afterAll(async () => {
  await prisma.$disconnect();
});

test("CRUD User", async () => {
  const create = await request(app).post("/users").send({ name: "Ana", email: "ana@ex.com" });
  expect(create.status).toBe(201);
  const id = create.body.id;

  const list = await request(app).get("/users");
  expect(list.status).toBe(200);
  expect(Array.isArray(list.body)).toBe(true);

  const get = await request(app).get(`/users/${id}`);
  expect(get.status).toBe(200);
  expect(get.body.email).toBe("ana@ex.com");

  const upd = await request(app).put(`/users/${id}`).send({ name: "Ana Paula" });
  expect(upd.status).toBe(200);
  expect(upd.body.name).toBe("Ana Paula");

  const del = await request(app).delete(`/users/${id}`);
  expect(del.status).toBe(204);
});

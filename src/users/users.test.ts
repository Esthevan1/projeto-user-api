// ✅ Banco correto antes do Prisma carregar
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

import request from "supertest";
import { app } from "../app";
import { prisma } from "../db";
import { generateToken } from "../auth/mock-jwks";

describe("Auth + Users Routes", () => {
  const adminToken = generateToken("admin");

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/users");
    expect(res.status).toBe(401);
  });

  it("should allow admin to list users", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});

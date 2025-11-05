process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/db";
import { generateToken } from "../src/auth/mock-jwks";

describe("Auth + Users routes (RBAC)", () => {
  const adminToken = generateToken("admin");
  const userToken = generateToken("user");

  beforeAll(async () => {
    await prisma.$connect();
    // limpa a tabela antes de começar os testes
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/users");
    expect(res.status).toBe(401);
  });

  it("should forbid non-admin listing users", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it("should allow admin to create a user", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Alice Test",
        email: "alice.test@example.com",
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Alice Test",
      email: "alice.test@example.com",
    });
  });

  it("should allow admin to list users", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

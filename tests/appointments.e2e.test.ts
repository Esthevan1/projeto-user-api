process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/db";
import { generateToken } from "../src/auth/mock-jwks";

const shouldRun = !!process.env.DATABASE_URL;
(shouldRun ? describe : describe.skip)("Appointments E2E (requires TEST_DATABASE_URL)", () => {
  let userToken: string;
  let adminToken: string;
  let service: any;
  let appointmentId: string;
  let connected = false;
  let userId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      connected = true;
    } catch (err) {
      console.warn("E2E tests: could not connect to TEST DB, skipping e2e flow tests.", (err as any)?.message || err);
      connected = false;
      return;
    }

    if (!connected) return;

    await prisma.appointment.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();

    // create a user that matches the mock token default sub (or use generated id)
    const user = await prisma.user.create({ data: { id: "test-user", name: "E2E User", email: "e2e.user@example.com" } });
    userId = user.id;

    // generate tokens that reference the created user
    userToken = generateToken("user", userId);
    adminToken = generateToken("admin", userId);

    service = await prisma.service.create({ data: { name: "E2E Service", durationMin: 30 } });
  });

  afterAll(async () => {
    if (!connected) return;
    await prisma.appointment.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("books an appointment and prevents conflicts", async () => {
    if (!connected) { console.warn("Skipping test: DB not available"); return; }
    const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // book first
    const res1 = await request(app)
      .post("/api/v1/appointments")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ serviceId: service.id, startAt: start });

    expect(res1.status).toBe(201);
    appointmentId = res1.body.id;

    // attempt conflicting booking (same time) -> 409
    const res2 = await request(app)
      .post("/api/v1/appointments")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ serviceId: service.id, startAt: start });

    expect(res2.status).toBe(409);
  });

  it("allows admin/operator to confirm an appointment", async () => {
    if (!connected) { console.warn("Skipping test: DB not available"); return; }
    const res = await request(app)
      .post(`/api/v1/appointments/${appointmentId}/confirm`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("confirmed");
  });

  it("allows owner to cancel appointment", async () => {
    if (!connected) { console.warn("Skipping test: DB not available"); return; }
    const userToken2 = generateToken("user");
    const res = await request(app)
      .post(`/api/v1/appointments/${appointmentId}/cancel`)
      .set("Authorization", `Bearer ${userToken2}`)
      .send();

    // owner is test-user by default in generateToken
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("canceled");
  });
});

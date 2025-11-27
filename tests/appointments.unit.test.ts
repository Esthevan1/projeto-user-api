jest.mock("../src/db", () => {
  const jestMock = require("jest-mock");
  const fn = jestMock.fn;
  return {
    prisma: {
      service: { findUnique: fn() },
      appointment: { findFirst: fn(), create: fn() },
    },
  };
});

// Prevent the real Auth0 initializer from running during tests (it requires env vars)
jest.mock("../src/auth/jwt-auth0.middleware", () => ({
  requireAuth0: () => (req: any, res: any, next: any) => next(),
}));

import request from "supertest";
import { app } from "../src/app";
import { generateToken } from "../src/auth/mock-jwks";
import { prisma } from "../src/db";

describe("Appointments controller (unit, mocked prisma)", () => {
  const token = generateToken("user");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates appointment and calculates endAt from service.durationMin", async () => {
    const serviceId = "11111111-1111-1111-1111-111111111111";
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const startIso = start.toISOString();
    const duration = 45;

    (prisma as any).service.findUnique.mockResolvedValue({ id: serviceId, durationMin: duration });
    (prisma as any).appointment.findFirst.mockResolvedValue(null);

    const expectedEnd = new Date(start.getTime() + duration * 60000);
    const created = {
      id: "a1",
      userId: "test-user",
      serviceId,
      startAt: start.toISOString(),
      endAt: expectedEnd.toISOString(),
      status: "booked",
    };
    (prisma as any).appointment.create.mockResolvedValue(created);

    const res = await request(app)
      .post("/api/v1/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ serviceId, startAt: startIso });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ userId: "test-user", serviceId, status: "booked" });
    expect(new Date(res.body.endAt).toISOString()).toBe(expectedEnd.toISOString());
  });

  it("returns 409 when there is a conflicting appointment", async () => {
    const serviceId = "22222222-2222-2222-2222-222222222222";
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const startIso = start.toISOString();
    const duration = 30;

    (prisma as any).service.findUnique.mockResolvedValue({ id: serviceId, durationMin: duration });
    (prisma as any).appointment.findFirst.mockResolvedValue({ id: "conflict" });

    const res = await request(app)
      .post("/api/v1/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ serviceId, startAt: startIso });

    expect(res.status).toBe(409);
  });
});

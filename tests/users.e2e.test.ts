process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

import { prisma } from "../src/db";

describe("Database connection (Prisma)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should connect to DB and run a simple query", async () => {
    const result = await prisma.$queryRaw`SELECT 1`;
    expect(result).toBeTruthy();
  });
});

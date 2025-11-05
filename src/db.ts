import { PrismaClient } from "@prisma/client";

const environment = process.env.NODE_ENV;
const databaseUrl =
  environment === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

if (!databaseUrl || !databaseUrl.startsWith("postgres")) {
  console.error("DATABASE_URL inválida no ambiente:", environment);
  console.error("Valor recebido:", databaseUrl);
  throw new Error("DATABASE_URL inválida para o Prisma");
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

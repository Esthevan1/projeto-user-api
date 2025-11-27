import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// load .env if present
dotenv.config();

const environment = process.env.NODE_ENV;

function buildFallbackDatabaseUrl() {
  // prefer explicit envs if provided
  const user = process.env.POSTGRES_USER || process.env.DB_USER || "postgres";
  const pass = process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || "postgres";
  const host = process.env.DB_HOST || process.env.POSTGRES_HOST || "localhost";
  // many setups map host port 5434 -> container 5432 (this repo's compose uses 5434)
  const port = process.env.DB_PORT || process.env.POSTGRES_PORT || (host === "localhost" ? "5434" : "5432");
  const db = process.env.POSTGRES_DB || process.env.DB_NAME || "userdb";
  return `postgresql://${user}:${pass}@${host}:${port}/${db}?schema=public`;
}

const databaseUrl =
  environment === "test"
    ? process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || buildFallbackDatabaseUrl()
    : process.env.DATABASE_URL || buildFallbackDatabaseUrl();

if (!databaseUrl || !databaseUrl.startsWith("postgres")) {
  console.error("DATABASE_URL inválida no ambiente:", environment);
  console.error("Valor recebido:", databaseUrl);
  throw new Error(
    "DATABASE_URL inválida para o Prisma; configure DATABASE_URL ou defina POSTGRES_* / DB_* no ambiente"
  );
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

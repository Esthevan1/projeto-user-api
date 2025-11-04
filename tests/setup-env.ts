import dotenv from "dotenv";

console.log("Carregando variáveis de ambiente para TESTES...");

dotenv.config({ path: ".env.test" });

process.env.NODE_ENV = "test";
console.log("NODE_ENV=", process.env.NODE_ENV);
console.log("DATABASE_URL=", process.env.DATABASE_URL);

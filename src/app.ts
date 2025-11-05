import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerOptions from "./swagger";
import { usersRouter } from "./users/users.router";

export const app = express();

app.use(express.json());

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/users", usersRouter);

app.get("/", (_, res) => {
  res.send("API do Projeto User - OK");
});

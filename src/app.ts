import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerOptions from "./swagger";
import { usersRouter } from "./users/users.router";
import { servicesRouter } from "./services/services.router";
import { appointmentsRouter } from "./appointments/appointments.router";

export const app = express();

app.use(express.json());

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// versioned API
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/services", servicesRouter);
app.use("/api/v1/appointments", appointmentsRouter);

app.get("/", (_, res) => {
  res.send("API do Projeto User - OK");
});

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Projeto User API",
      version: "1.0.0",
      description:
          "API de exemplo com domínio de agendamentos: usuários, serviços e agendamentos. Autenticação JWT (Auth0) e RBAC (roles admin/operator/user).",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local",
      },
      {
        url: "http://localhost:3001",
        description: "Servidor local (via Docker Compose mapping)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "9fb4a812-3191-4d7a-8dff-92e0eff521f7" },
            name: { type: "string", example: "Alice" },
            email: { type: "string", example: "alice@example.com" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateUserInput: {
          type: "object",
          required: ["name", "email"],
          properties: {
            name: { type: "string", example: "Alice" },
            email: { type: "string", format: "email", example: "alice@example.com" },
          },
        },
        Service: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            durationMin: { type: "integer", example: 30 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          }
        },
        CreateServiceInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            durationMin: { type: "integer", example: 30 }
          }
        },
        Appointment: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            serviceId: { type: "string" },
            startAt: { type: "string", format: "date-time" },
            endAt: { type: "string", format: "date-time" },
            status: { type: "string", example: "booked" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        CreateAppointmentInput: {
          type: "object",
          required: ["serviceId","startAt"],
          properties: {
            serviceId: { type: "string" },
            startAt: { type: "string", format: "date-time" }
          }
        }
      ,
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Not found" },
            details: { type: "object" }
          }
        }
      },
      responses: {
        BadRequest: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { message: "Validation failed", details: { field: "startAt" } }
            }
          }
        },
        Unauthorized: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { message: "Missing Bearer token" }
            }
          }
        },
        Forbidden: {
          description: "Forbidden",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { message: "Forbidden: admin only" }
            }
          }
        },
        NotFound: {
          description: "Not Found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { message: "Resource not found" }
            }
          }
        },
        Conflict: {
          description: "Conflict",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { message: "Time slot not available" }
            }
          }
        }
      }
    },
    paths: {},
    security: [
  {
    bearerAuth: [],
  },
],

    
  },
  apis: ["./src/**/*.ts"],
};

export default swaggerOptions;
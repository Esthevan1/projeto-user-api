const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Projeto User API",
      version: "1.0.0",
      description:
        "API para gerenciamento de usuários, com autenticação JWT via Auth0 e RBAC (roles admin/user).",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local",
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
      },
    },
    security: [
  {
    bearerAuth: [],
  },
],

    
  },
  apis: ["./src/users/*.ts"],
};

export default swaggerOptions;
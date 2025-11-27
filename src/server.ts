// src/server.ts
import "dotenv/config";
import { app } from "./app";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
  console.log(`SWAGGER running on http://localhost:3000/api-docs`);
  console.log(`SWAGGER running on http://localhost:3001/api-docs`);
});

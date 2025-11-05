import jwt from "jsonwebtoken";

const SECRET = "SUPER_SECRET_LOCAL_KEY";

export function generateToken(role: "admin" | "user", sub?: string) {
  const scope =
    role === "admin" ? "read:users write:users" : "read:users";

  return jwt.sign(
    {
      sub: sub || "test-user",
      role,              // ainda existe para compatibilidade
      roles: [role],     // usado pelo requireRole novo
      scope,             // simula o token do Auth0
      iss: "http://localhost:3001/",
      aud: "projeto-user-api",
    },
    SECRET,
    { expiresIn: "1h" }
  );
}

export const jwks = {
  keys: [
    {
      kty: "oct",
      kid: "local-key",
      k: Buffer.from(SECRET).toString("base64"),
    },
  ],
};

import jwt from "jsonwebtoken";

const SECRET = "SUPER_SECRET_LOCAL_KEY";

export function generateToken(role: "admin" | "user", sub?: string) {
  return jwt.sign(
    {
      sub: sub || "test-user",
      role,
      iss: "http://localhost:3001/",
      aud: "user-api",
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

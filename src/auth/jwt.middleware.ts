import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = "SUPER_SECRET_LOCAL_KEY";

declare global {
  namespace Express {
    interface Request {
      // usado apenas nos testes (ambiente local)
      user?: any;
    }
  }
}

// Middleware simples de autenticação para AMBIENTE DE TESTES.
// Em produção, usamos o requireAuth0 (express-oauth2-jwt-bearer).
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = (req.headers.authorization ||
    (req.headers as any).Authorization) as string | undefined;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.substring("Bearer ".length).trim();

  try {
    const decoded = jwt.verify(token, SECRET);
    // nos testes vamos ler esses dados via req.user
    (req as any).user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Middleware de RBAC simples baseado em roles no token.
// Mantém compatibilidade com Auth0 (req.auth) e com o mock local (req.user).
export function requireRole(requiredRole: "admin" | "user" | "operator") {
  return (req: Request, res: Response, next: NextFunction) => {
    const anyReq = req as any;
    const auth = anyReq.auth || anyReq.user;

    if (!auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // se vier do Auth0, payload fica em auth.payload
    const claims = auth.payload ?? auth;

    const roles: string[] =
      claims.roles ||
      claims["https://projeto-user-api/roles"] ||
      [];

    const isAdmin = roles.includes("admin");
    const isOperator = roles.includes("operator");
    const isUser = roles.includes("user");

    if (requiredRole === "admin") {
      if (!isAdmin) {
        return res.status(403).json({ message: "Forbidden: admin only" });
      }
      return next();
    }

    if (requiredRole === "user") {
      if (!(isUser || isAdmin)) {
        return res.status(403).json({ message: "Forbidden: user only" });
      }
      return next();
    }

    if (requiredRole === "operator") {
      if (!(isOperator || isAdmin)) {
        return res.status(403).json({ message: "Forbidden: operator only" });
      }
      return next();
    }

    return next();
  };
}

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = "SUPER_SECRET_LOCAL_KEY";

declare global {
  namespace Express {
    interface Request {
      // só adicionamos user; auth já é declarado pelo express-oauth2-jwt-bearer
      user?: any;
    }
  }
}

// usado nos testes (mock local) – em produção você usa o requireAuth0
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;

  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing Bearer token" });
  }

  const token = auth.slice(7);

  try {
    const decoded = jwt.verify(token, SECRET) as any;
    req.user = decoded;
    // validate standard claims when running tests too
    const { validateJwtClaims } = require("./claims.middleware");
    // claims middleware expects (req,res,next)
    return validateJwtClaims(req, res, next);
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
}

export function requireRole(requiredRole: "admin" | "user" | "operator") {
  return (req: Request, res: Response, next: NextFunction) => {
    const anyReq = req as any;

    // em produção vem de express-oauth2-jwt-bearer (req.auth)
    // em testes vem de requireAuth (req.user)
    const auth = anyReq.auth || anyReq.user;

    if (!auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Se veio do express-oauth2-jwt-bearer, os claims estão em auth.payload
    const claims = auth.payload ?? auth;

    const tokenRoles: string[] =
      claims.roles ||
      claims["https://projeto-user-api/roles"] ||
      [];

    const permissions: string[] = claims.permissions || [];

    const scopeStr: string | undefined = claims.scope;
    const scopes: string[] = scopeStr ? scopeStr.split(" ") : [];

    const isAdmin =
      tokenRoles.includes("admin") ||
      permissions.includes("write:users") ||
      scopes.includes("write:users");

    const isUser =
      tokenRoles.includes("user") ||
      permissions.includes("read:users") ||
      scopes.includes("read:users");

    const isOperator = tokenRoles.includes("operator") || permissions.includes("manage:appointments") || scopes.includes("manage:appointments");

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

// src/middlewares/rbac.middleware.ts
import { Request, Response, NextFunction } from "express";

type AuthInfo = {
  sub?: string;
  scope?: string;
  permissions?: string[];
  roles?: string[];
};

// tenta achar info de auth tanto do express-oauth2-jwt-bearer (req.auth)
// quanto de middlewares próprios (req.user)
function getAuth(req: Request): AuthInfo | undefined {
  const anyReq = req as any;
  return anyReq.auth || anyReq.user;
}

function hasScope(auth: AuthInfo | undefined, neededScope: string): boolean {
  if (!auth) return false;

  if (auth.permissions && auth.permissions.includes(neededScope)) {
    return true;
  }

  if (auth.scope) {
    const scopes = auth.scope.split(" ");
    if (scopes.includes(neededScope)) {
      return true;
    }
  }

  return false;
}

function hasRole(auth: AuthInfo | undefined, role: string): boolean {
  if (!auth) return false;
  if (!auth.roles) return false;
  return auth.roles.includes(role);
}

// aqui consideramos admin quem tiver role "admin"
// ou quem tiver escopo write:users no token
function isAdmin(auth: AuthInfo | undefined): boolean {
  return hasRole(auth, "admin") || hasScope(auth, "write:users");
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);

  if (!auth) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!isAdmin(auth)) {
    return res.status(403).json({ message: "Forbidden: admin only" });
  }

  return next();
}

// dono do recurso (id do token igual ao :id) ou admin
export function requireSelfOrAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);

  if (!auth) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userIdFromRoute = req.params.id;
  const subject = auth.sub; // normalmente vem no claim "sub"

  if (isAdmin(auth)) {
    return next();
  }

  if (subject && subject === userIdFromRoute) {
    return next();
  }

  return res.status(403).json({ message: "Forbidden: not owner" });
}

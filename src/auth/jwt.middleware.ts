import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = "SUPER_SECRET_LOCAL_KEY";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;

  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing Bearer token" });
  }

  const token = auth.slice(7);

  try {
    const decoded = jwt.verify(token, SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
}

export function requireRole(role: "admin" | "user") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Missing role" });
    }

    if (req.user.role !== role && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}

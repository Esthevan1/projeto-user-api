import { Request, Response, NextFunction } from "express";

function getClaims(req: Request): any | undefined {
  const anyReq = req as any;
  // express-oauth2-jwt-bearer sets req.auth.payload
  if (anyReq.auth && anyReq.auth.payload) return anyReq.auth.payload;
  // our test middleware sets req.user
  if (anyReq.user) return anyReq.user;
  return undefined;
}

export function validateJwtClaims(req: Request, res: Response, next: NextFunction) {
  const claims = getClaims(req);
  if (!claims) return res.status(401).json({ message: "Unauthorized: missing token claims" });

  const expectedIss = process.env.JWT_ISSUER;
  const expectedAud = process.env.JWT_AUDIENCE;

  if (expectedIss && claims.iss && claims.iss !== expectedIss) {
    return res.status(401).json({ message: `Invalid token issuer (iss). Expected ${expectedIss}` });
  }

  if (expectedAud) {
    const aud = claims.aud || claims.audience;
    if (!aud) {
      return res.status(401).json({ message: "Invalid token: missing aud" });
    }
    // aud can be string or array
    if (Array.isArray(aud)) {
      if (!aud.includes(expectedAud)) {
        return res.status(401).json({ message: `Invalid token audience (aud). Expected ${expectedAud}` });
      }
    } else {
      if (aud !== expectedAud) {
        return res.status(401).json({ message: `Invalid token audience (aud). Expected ${expectedAud}` });
      }
    }
  }

  // exp and nbf validation: allow libraries to validate, but double-check if present
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && typeof claims.exp === "number" && now >= claims.exp) {
    return res.status(401).json({ message: "Token expired (exp)" });
  }
  if (claims.nbf && typeof claims.nbf === "number" && now < claims.nbf) {
    return res.status(401).json({ message: "Token not yet valid (nbf)" });
  }

  return next();
}

export default validateJwtClaims;

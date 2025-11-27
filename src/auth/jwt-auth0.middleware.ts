import { auth } from "express-oauth2-jwt-bearer";
import { auth0Config } from "./auth0.config";
import { Request, Response, NextFunction } from "express";
import validateJwtClaims from "./claims.middleware";

const baseAuth = auth({
  audience: auth0Config.audience,
  issuerBaseURL: auth0Config.issuerBaseURL,
  tokenSigningAlg: "RS256",
});

// compose baseAuth and our claims validator into a single middleware
export function requireAuth0(req: Request, res: Response, next: NextFunction) {
  baseAuth(req, res, (err?: any) => {
    if (err) return next(err);
    // express-oauth2-jwt-bearer sets req.auth
    return validateJwtClaims(req, res, next);
  });
}

export default requireAuth0;

import { auth } from "express-oauth2-jwt-bearer";
import { auth0Config } from "./auth0.config";
import { Request, Response, NextFunction } from "express";
import validateJwtClaims from "./claims.middleware";

const isTestEnv = process.env.NODE_ENV === "test";

// No ambiente de teste NÃO inicializamos o Auth0 de verdade.
// Isso evita erro no CI se JWT_ISSUER / JWT_AUDIENCE não estiverem definidos.
const baseAuth =
  isTestEnv
    ? (req: Request, res: Response, next: NextFunction) => next()
    : auth({
        audience: auth0Config.audience,
        issuerBaseURL: auth0Config.issuerBaseURL,
        tokenSigningAlg: "RS256",
      });

// Middleware usado em produção/desenvolvimento.
// Nos testes, as rotas já usam `requireAuth` em vez de `requireAuth0`.
export function requireAuth0(req: Request, res: Response, next: NextFunction) {
  return baseAuth(req, res, (err?: any) => {
    if (err) return next(err);

    if (isTestEnv) {
      // Em teste não rodamos validação de claims do Auth0 real.
      return next();
    }

    // Em dev/prod validamos claims normalmente.
    return validateJwtClaims(req, res, next);
  });
}

export default requireAuth0;

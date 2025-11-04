import { auth } from "express-oauth2-jwt-bearer";
import { auth0Config } from "./auth0.config";

export const requireAuth0 = auth({
  audience: auth0Config.audience,
  issuerBaseURL: auth0Config.issuerBaseURL,
  tokenSigningAlg: "RS256",
});

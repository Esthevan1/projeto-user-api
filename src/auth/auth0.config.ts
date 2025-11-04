export const auth0Config = {
  issuerBaseURL: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
  jwksUri: process.env.JWKS_URI
};

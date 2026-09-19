import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

if (!JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.error('Missing JWT_SECRET. Check server/.env against server/.env.example.');
}

export const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '7d', algorithm: 'HS256' });

// Returns the decoded payload, or null if the token is missing/invalid/expired.
// Pinning `algorithms` explicitly means a token signed (or forged) with a
// different algorithm - including the classic "alg: none" trick - is always
// rejected, regardless of what the token's own header claims.
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
};

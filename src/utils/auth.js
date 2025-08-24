import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret@$%&123";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

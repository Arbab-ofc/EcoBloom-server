import { verifyJwt } from "../utils/auth.js";

const COOKIE_NAME = process.env.COOKIE_NAME || "token";


export function protect(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  console.log(payload)

  req.user = payload; 
  console.log(req.user);
  next();
}


export function adminOnly(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  next();
}

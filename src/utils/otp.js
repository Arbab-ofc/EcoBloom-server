import crypto from "crypto";

export function generateOtp(len = 6) {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < len; i++) otp += digits[Math.floor(Math.random() * 10)];
  return otp;
}
export function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

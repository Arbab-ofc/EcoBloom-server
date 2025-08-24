
export function otpEmail({ name = "User", otp, minutes = 10 }) {
  const subject = "EcoBloom OTP Verification";

  const text = `Hi ${name},

Your EcoBloom OTP is: ${otp}
It will expire in ${minutes} minutes.

If you didn't request this, please ignore.`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px;">
    <h2 style="color:#2e7d32;">🌿 EcoBloom Verification</h2>
    <p>Hi <b>${name}</b>,</p>
    <p>Your OTP code is:</p>
    <div style="font-size:28px;font-weight:700;letter-spacing:4px;padding:10px 20px;background:#f4f6f8;border-radius:8px;display:inline-block;">
      ${otp}
    </div>
    <p style="margin-top:20px;">This OTP will expire in <b>${minutes} minutes</b>.</p>
    <p style="font-size:12px;color:#888;">If you didn’t request this, please ignore this email.</p>
    <hr/>
    <p style="font-size:12px;color:#aaa;">EcoBloom • Greenify your space 🌱</p>
  </div>
  `;

  return { subject, text, html };
}

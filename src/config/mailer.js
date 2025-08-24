import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";



const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, 
  auth: {
    user: process.env.MAILUSER,
    pass: process.env.MAILPASS,
  },
});

export async function sendEmail({ to, subject, html, text }) {
    console.log(process.env.MAILUSER)
    console.log(process.env.MAILPASS)
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAILUSER,
    to,
    subject,
    text,
    html,
  });

  console.log("✅ Email sent:", info.messageId);
  return info;
}

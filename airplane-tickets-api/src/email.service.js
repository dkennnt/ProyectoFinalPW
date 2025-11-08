import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Airplane Tickets" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Correo enviado ${to}`);
  } catch (err) {
    console.error("Error al enviar correo:", err);
  }
}

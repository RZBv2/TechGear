import "dotenv/config";
import { createTransport } from "nodemailer";

const smtpHost = process.env["SMTP_HOST"]?.trim();
const smtpPort = Number(process.env["SMTP_PORT"] ?? 587);
const smtpUser = process.env["SMTP_USER"]?.trim();
const smtpPassword = process.env["SMTP_PASSWORD"];
const mailFrom =
  process.env["SMTP_FROM"]?.trim() || smtpUser || "no-reply@techgear.local";
const appUrl =
  process.env["TECHGEAR_APP_URL"]?.trim() || "http://localhost:3000";

function hasSmtpConfiguration() {
  return Boolean(smtpHost && smtpUser && smtpPassword);
}

export async function sendVerificationEmail(input: {
  to: string;
  name: string;
  code: string;
}) {
  if (!hasSmtpConfiguration()) {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error(
        "Email delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD and SMTP_FROM before enabling production signups.",
      );
    }
    console.info(
      `[TechGear email verification] ${input.to}: ${input.code} (configure SMTP to send real emails)`,
    );
    return { delivered: false as const, developmentCode: input.code };
  }

  const transporter = createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPassword },
  });

  await transporter.sendMail({
    from: mailFrom,
    to: input.to,
    subject: "Verify your TechGear account",
    text: `Hi ${input.name},\n\nYour TechGear verification code is ${input.code}. It expires in 15 minutes.\n\nIf you did not create this account, you can ignore this email.\n\n${appUrl}`,
    html: `<!doctype html><html><body style="margin:0;background:#f4f1eb;padding:32px;font-family:Arial,sans-serif;color:#1f2522"><div style="max-width:560px;margin:auto;background:#fff;padding:36px;border:1px solid #e6e0d5"><p style="letter-spacing:.18em;text-transform:uppercase;font-size:12px;color:#7c6f5b">TechGear</p><h1 style="font-size:28px;margin:16px 0">Verify your account</h1><p>Hi ${escapeHtml(input.name)},</p><p>Enter this verification code to finish creating your TechGear account:</p><p style="font-size:34px;letter-spacing:.3em;font-weight:700;margin:28px 0;color:#a56b32">${input.code}</p><p style="color:#6c6a64">This code expires in 15 minutes. If you did not create this account, you can ignore this email.</p><p style="margin-top:28px"><a href="${appUrl}" style="color:#a56b32">Visit TechGear</a></p></div></body></html>`,
  });
  return { delivered: true as const };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character] ?? character;
  });
}

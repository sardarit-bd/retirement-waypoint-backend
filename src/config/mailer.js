import "./env.js";
import nodemailer from "nodemailer";

let transporter = null;

export const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass) {
    console.warn(
      `⚠️ SMTP configuration incomplete. host=${host ? "set" : "missing"}, user=${user ? "set" : "missing"}, pass=${pass ? "set" : "missing"}`
    );
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    return transporter;
  } catch (error) {
    console.error("❌ Email transporter initialization failed:", error.message);
    return null;
  }
};

// Initialize transporter on load
getTransporter();

export const sendEmail = async ({ to, subject, text, html }) => {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    console.error(`❌ Email transporter not configured. Cannot send email to ${to}.`);
    throw new Error("Email service is not configured on server.");
  }

  const senderUser = process.env.SMTP_USER || "dave@retirementwaypoint.com";
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || `"Retirement Waypoint" <${senderUser}>`;

  try {
    const info = await activeTransporter.sendMail({
      from,
      to,
      subject,
      text,
      html: html || text,
    });
    console.log(`✅ Email sent successfully to ${to} (Subject: "${subject}"): MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to} (Subject: "${subject}"):`, error.message);
    throw error;
  }
};

export const verifyEmailConnection = async () => {
  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    return { error: "Transporter not configured" };
  }
  try {
    await activeTransporter.verify();
    console.log("✅ SMTP server connection verified successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ SMTP server verification failed:", error.message);
    return { error: error.message };
  }
};
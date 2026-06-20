import nodemailer from "nodemailer";

// Create transporter with better error handling
let transporter = null;

try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} catch (error) {
  console.error("❌ Email transporter initialization failed:", error.message);
}

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    console.warn("⚠️ Email transporter not configured. Skipping email send.");
    return { messageId: "skipped" };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@retirement-waypoint.com",
      to,
      subject,
      text,
      html: html || text,
    });
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    // Don't throw error to prevent breaking the flow
    return { error: error.message };
  }
};

export const verifyEmailConnection = async () => {
  if (!transporter) {
    return { error: "Transporter not configured" };
  }
  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
};
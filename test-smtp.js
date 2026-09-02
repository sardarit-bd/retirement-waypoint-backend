import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
const host = process.env.SMTP_HOST || "mail.privateemail.com";
const port = Number(process.env.SMTP_PORT) || 465;
const secure = process.env.SMTP_SECURE === "true" || port === 465;

console.log("==========================================");
console.log("🔍 TESTING SMTP CONFIGURATION");
console.log("==========================================");
console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`Secure: ${secure}`);
console.log(`User: ${user}`);
console.log(`Password length: ${pass ? pass.length : 0} characters`);
console.log("==========================================\n");

async function testConnection(testPort, testSecure) {
  console.log(`⏳ Attempting connection on port ${testPort} (secure: ${testSecure})...`);

  const transporter = nodemailer.createTransport({
    host,
    port: testPort,
    secure: testSecure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
    debug: true,
    logger: true,
  });

  try {
    await transporter.verify();
    console.log(`✅ [Port ${testPort}] Transporter verification SUCCESSFUL!`);

    console.log(`⏳ Sending test email to owakeel.workspace@gmail.com...`);
    const info = await transporter.sendMail({
      from: `"Retirement Waypoint Test" <${user}>`,
      to: "owakeel.workspace@gmail.com",
      subject: "SMTP Test Verification - Retirement Waypoint",
      text: "This is a test email to verify SMTP delivery from Retirement Waypoint.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #1B2B4B;">SMTP Delivery Test Successful!</h2>
          <p>This email confirms that the SMTP credentials for <strong>${user}</strong> on <strong>${host}:${testPort}</strong> are functioning properly.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log(`🎉 Test email sent successfully! MessageId: ${info.messageId}`);
    console.log(`Response: ${info.response}`);
    return true;
  } catch (error) {
    console.error(`❌ [Port ${testPort}] Failed:`);
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Command: ${error.command}`);
    console.error(`Response Code: ${error.responseCode}`);
    console.error(`Message: ${error.message}`);
    if (error.response) {
      console.error(`Server Response: ${error.response}`);
    }
    return false;
  }
}

async function run() {
  const success465 = await testConnection(465, true);
  if (!success465) {
    console.log("\n⚠️ Port 465 failed. Testing Port 587 with STARTTLS...\n");
    await testConnection(587, false);
  }
  console.log("\n🏁 SMTP Test Completed.");
  process.exit(0);
}

run();

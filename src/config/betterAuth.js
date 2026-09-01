import "./env.js";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin, emailOTP } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { UserProfile } from "../modules/auth/auth.model.js";
import { sendEmail } from "./mailer.js";
import { authAllowedHosts } from "./origins.js";

// MongoDB connection
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined");
  process.exit(1);
}

const mongoClient = new MongoClient(process.env.MONGODB_URI);

// Connect to MongoDB
await mongoClient.connect();
console.log("✅ MongoDB connected for Better Auth");

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not configured");
}

// Better Auth configuration
export const auth = betterAuth({
  database: mongodbAdapter(mongoClient.db()),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: {
    allowedHosts: authAllowedHosts,
    protocol: "auto",
  },
  basePath: "/api/auth",
  advanced: {
    trustedProxyHeaders: true,
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,

    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Reset your password: ${url}`,
        html: `
          <h2>Reset your password</h2>
          <p>Hello ${user.name},</p>
          <p>Click below to reset your password.</p>
          <a href="${url}">Reset Password</a>
          <p>This link expires in one hour.</p>
        `,
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Verify your email: ${url}`,
        html: `
          <h2>Verify your email</h2>
          <p>Hello ${user.name},</p>
          <p>Click the button below to verify your email address.</p>
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Verify Email</a>
          <p>This link expires in one hour.</p>
        `,
      });
    },
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: false,
    expiresIn: 60 * 60, // 1 hour
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: 5 * 60, // 5 minutes
      allowedAttempts: 3,
      changeEmail: {
        enabled: true,
        verifyCurrentEmail: false,
      },
      sendVerificationOTP: async ({ email, otp, type }, request) => {
        console.log("➡️ [BetterAuth OTP Triggered]:", { email, otp, type });

        try {
          if (type === "forget-password") {
            await sendEmail({
              to: email,
              subject: "Your password reset code - Retirement Waypoint",
              text: `Your password reset code is: ${otp}. This code expires in 5 minutes.`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
                  <div style="background: #1B2B4B; padding: 24px; text-align: center;">
                    <h1 style="color: #C9A84C; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 1px;">RETIREMENT WAYPOINT</h1>
                  </div>
                  <div style="padding: 32px 24px;">
                    <h2 style="color: #1B2B4B; margin: 0 0 12px; font-size: 18px;">Password Reset Code</h2>
                    <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                      We received a request to reset your password. Use the 6-digit verification code below:
                    </p>
                    <div style="background: #F8F5EF; border: 1px dashed #C9A84C; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px;">
                      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1B2B4B;">${otp}</span>
                    </div>
                    <p style="color: #888888; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">
                      ⏰ This code will expire in <strong>5 minutes</strong>.
                    </p>
                    <p style="color: #888888; font-size: 13px; line-height: 1.5; margin: 0;">
                      If you did not request a password reset, you can safely ignore this email.
                    </p>
                  </div>
                  <div style="background: #f9f9f9; border-top: 1px solid #eaeaea; padding: 16px 24px; text-align: center;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} Retirement Waypoint. All rights reserved.
                    </p>
                  </div>
                </div>
              `,
            });
            console.log(`✅ [BetterAuth OTP] Password reset OTP sent to ${email}`);
            return;
          }

          if (type === "change-email") {
            await sendEmail({
              to: email,
              subject: "Verify your new email address - Retirement Waypoint",
              text: `Your email verification code is: ${otp}. This code expires in 5 minutes.`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
                  <div style="background: #1B2B4B; padding: 24px; text-align: center;">
                    <h1 style="color: #C9A84C; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 1px;">RETIREMENT WAYPOINT</h1>
                  </div>
                  <div style="padding: 32px 24px;">
                    <h2 style="color: #1B2B4B; margin: 0 0 12px; font-size: 18px;">Verify Your New Email Address</h2>
                    <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                      We received a request to update your account email address. Please use the following 6-digit verification code to confirm this change:
                    </p>
                    <div style="background: #F8F5EF; border: 1px dashed #C9A84C; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px;">
                      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1B2B4B;">${otp}</span>
                    </div>
                    <p style="color: #888888; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">
                      ⏰ This verification code will expire in <strong>5 minutes</strong>.
                    </p>
                    <p style="color: #888888; font-size: 13px; line-height: 1.5; margin: 0;">
                      If you did not request this change, you can safely ignore this email. Your current email address will remain unchanged.
                    </p>
                  </div>
                  <div style="background: #f9f9f9; border-top: 1px solid #eaeaea; padding: 16px 24px; text-align: center;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} Retirement Waypoint. All rights reserved.
                    </p>
                  </div>
                </div>
              `,
            });
            console.log(`✅ [BetterAuth OTP] Change-email OTP sent to ${email}`);
            return;
          }

          // Catch-all for any other OTP types (e.g. email-verification, sign-in)
          await sendEmail({
            to: email,
            subject: "Your verification code - Retirement Waypoint",
            text: `Your verification code is: ${otp}. This code expires in 5 minutes.`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
                <div style="background: #1B2B4B; padding: 24px; text-align: center;">
                  <h1 style="color: #C9A84C; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 1px;">RETIREMENT WAYPOINT</h1>
                </div>
                <div style="padding: 32px 24px;">
                  <h2 style="color: #1B2B4B; margin: 0 0 12px; font-size: 18px;">Your Verification Code</h2>
                  <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    Please use the following 6-digit verification code:
                  </p>
                  <div style="background: #F8F5EF; border: 1px dashed #C9A84C; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1B2B4B;">${otp}</span>
                  </div>
                  <p style="color: #888888; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">
                    ⏰ This code will expire in <strong>5 minutes</strong>.
                  </p>
                </div>
              </div>
            `,
          });
          console.log(`✅ [BetterAuth OTP] Generic OTP (${type}) sent to ${email}`);
        } catch (err) {
          console.error(`❌ [BetterAuth OTP] Failed to send OTP to ${email}:`, err.message);
          throw err;
        }
      },
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await UserProfile.updateOne(
            { userId: user.id },
            {
              $setOnInsert: {
                userId: user.id,
              },
            },
            { upsert: true },
          );
        },
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});
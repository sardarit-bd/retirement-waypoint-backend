import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError } from "better-auth/api";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { UserProfile } from "../modules/auth/auth.model.js";
import { sendEmail } from "./mailer.js";

dotenv.config();

// MongoDB connection
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined");
  process.exit(1);
}

const mongoClient = new MongoClient(process.env.MONGODB_URI);

// Connect to MongoDB
await mongoClient.connect();
console.log("✅ MongoDB connected for Better Auth");

// Better Auth configuration
export const auth = betterAuth({
  database: mongodbAdapter(mongoClient.db()),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "your-secret-key-at-least-32-characters-long!!",
  baseURL: process.env.BETTER_AUTH_BASE_URL || "http://localhost:5000",
  basePath: "/api/auth",

  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,

    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
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
      void sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Verify your email: ${url}`,
        html: `
          <h2>Verify your email</h2>
          <p>Hello ${user.name},</p>
          <p>Click the button below to verify your email address.</p>
          <a href="${url}">Verify Email</a>
        `,
      });
    },
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
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

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await UserProfile.updateOne(
            { userId: user.id },
            {
              $setOnInsert: {
                role: "user",
                isActive: true,
              },
            },
            { upsert: true },
          );
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const profile = await UserProfile.findOne({
            userId: session.userId,
          }).lean();

          if (profile?.isActive === false) {
            throw APIError.from("FORBIDDEN", {
              message: "Your account has been deactivated",
              code: "ACCOUNT_DEACTIVATED",
            });
          }
        },
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
  },
});

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
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

const parseOrigins = (...values) =>
  values
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((origin) => origin.trim())
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return origin;
      }
    })
    .filter(Boolean);

const authBaseURL =
  process.env.BETTER_AUTH_PUBLIC_URL ||
  process.env.FRONTEND_URL ||
  process.env.BETTER_AUTH_BASE_URL ||
  "http://localhost:5000";

const trustedOrigins = [
  ...new Set(
    parseOrigins(
      process.env.ALLOWED_ORIGINS || "http://localhost:3000",
      process.env.FRONTEND_URL,
      process.env.BETTER_AUTH_BASE_URL,
      authBaseURL,
    ),
  ),
];

// Better Auth configuration
export const auth = betterAuth({
  database: mongodbAdapter(mongoClient.db()),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "your-secret-key-at-least-32-characters-long!!",
  baseURL: authBaseURL,
  basePath: "/api/auth",

  trustedOrigins,

  // OAuth state validation requires the sign-in and callback requests to use
  // the same browser-visible auth origin. For the Next.js proxy flow, point
  // BETTER_AUTH_PUBLIC_URL or FRONTEND_URL at the frontend origin.
  advanced: {
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
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

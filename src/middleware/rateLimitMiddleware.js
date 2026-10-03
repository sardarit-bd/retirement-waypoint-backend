import rateLimit from "express-rate-limit";

const sensitiveRoutes = [
  "/sign-in",
  "/sign-up",
  "/forget-password",
  "/reset-password",
  "/send-verification",
  "/resend-verification",
  "/set-password",
  "/email-otp",
];

/**
 * Global rate limiter for standard API routes
 * Allows up to 300 requests per 15-minute window per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

/**
 * Strict rate limiter for sensitive authentication mutations and OTP endpoints
 * Limits to 10 requests per 15-minute window per IP to prevent brute-force and credential abuse.
 * Skips non-sensitive/read-only session checks (e.g., /get-session, /me) which stay under globalLimiter.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const target = (req.path || req.originalUrl || "").toLowerCase();
    return !sensitiveRoutes.some((route) => target.includes(route.toLowerCase()));
  },
  message: {
    success: false,
    statusCode: 429,
    message: "Too many authentication or verification attempts. Please wait 15 minutes before trying again.",
  },
});


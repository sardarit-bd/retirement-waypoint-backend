import dotenv from 'dotenv';

dotenv.config();

export const authConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRE || '7d',
  bcryptRounds: 10,
};

export const betterAuthConfig = {
  appName: 'Retirement Waypoint',
  baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET,
};
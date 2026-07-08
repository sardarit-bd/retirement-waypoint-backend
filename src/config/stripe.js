import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not defined');
  process.exit(1);
}

if (!process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL is not configured');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: false,
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
export const FRONTEND_URL = new URL(process.env.FRONTEND_URL).origin;

export default stripe;

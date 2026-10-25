import { z } from "zod";

// Create checkout session validation
export const createCheckoutSessionValidation = z.object({
  body: z.object({
    orderId: z.string().min(1, "Order ID is required"),
  }),
});

// Retry payment validation
export const retryPaymentValidation = z.object({
  params: z.object({
    orderId: z.string().min(1, "Order ID is required"),
  }),
});

// Create PayPal order validation
export const createPayPalOrderValidation = z.object({
  body: z.object({
    orderId: z.string().min(1, "Order ID is required"),
  }),
});

// Capture PayPal payment validation
export const capturePayPalOrderValidation = z.object({
  body: z.object({
    paypalOrderId: z.string().min(1, "PayPal Order ID is required"),
    orderId: z.string().optional(),
  }),
});

// Stripe webhook validation (no Zod needed - raw body)
export { validate } from "../../middleware/validateMiddleware.js";

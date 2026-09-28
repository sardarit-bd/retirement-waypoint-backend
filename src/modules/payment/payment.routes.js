import express from "express";
import { PaymentController } from "./payment.controller.js";
import {
  createCheckoutSessionValidation,
  retryPaymentValidation,
  createPayPalOrderValidation,
  capturePayPalOrderValidation,
  validate,
} from "./payment.validation.js";
import { protect, optionalAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Stripe Webhook
router.post("/webhook", PaymentController.webhookHandler);

// PayPal Webhook
router.post("/paypal/webhook", PaymentController.paypalWebhookHandler);

// Stripe Checkout session creation supports both authenticated users and guests
router.post(
  "/create-checkout-session",
  optionalAuth,
  validate(createCheckoutSessionValidation),
  PaymentController.createCheckoutSession
);

// PayPal Order creation supports both authenticated users and guests
router.post(
  "/paypal/create-order",
  optionalAuth,
  validate(createPayPalOrderValidation),
  PaymentController.createPayPalOrder
);

// PayPal Order capture supports both authenticated users and guests
router.post(
  "/paypal/capture-order",
  optionalAuth,
  validate(capturePayPalOrderValidation),
  PaymentController.capturePayPalOrder
);

// Verify payment checkout session and retrieve order download info
router.get("/verify-session", PaymentController.verifySession);

// Protected routes below
router.use(protect);

router.post(
  "/retry/:orderId",
  validate(retryPaymentValidation),
  PaymentController.retryPayment
);

export const PaymentRoutes = router;
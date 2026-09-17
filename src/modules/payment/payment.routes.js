import express from "express";
import { PaymentController } from "./payment.controller.js";
import {
  createCheckoutSessionValidation,
  retryPaymentValidation,
  validate,
} from "./payment.validation.js";
import { protect, optionalAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/webhook", PaymentController.webhookHandler);

// Checkout session creation supports both authenticated users and guests
router.post(
  "/create-checkout-session",
  optionalAuth,
  validate(createCheckoutSessionValidation),
  PaymentController.createCheckoutSession
);

// Protected routes below
router.use(protect);

router.post(
  "/retry/:orderId",
  validate(retryPaymentValidation),
  PaymentController.retryPayment
);

export const PaymentRoutes = router;
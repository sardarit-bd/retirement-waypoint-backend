import express from "express";
import { PaymentController } from "./payment.controller.js";
import {
  createCheckoutSessionValidation,
  retryPaymentValidation,
  validate,
} from "./payment.validation.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/webhook", PaymentController.webhookHandler);

// ✅ Protected routes
router.use(protect);

router.post(
  "/create-checkout-session",
  validate(createCheckoutSessionValidation),
  PaymentController.createCheckoutSession
);

router.post(
  "/retry/:orderId",
  validate(retryPaymentValidation),
  PaymentController.retryPayment
);

export const PaymentRoutes = router;
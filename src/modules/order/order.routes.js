import express from "express";
import { OrderController } from "./order.controller.js";
import {
  createOrderValidation,
  getOrderByIdValidation,
  getOrdersValidation,
  getMyOrdersValidation,
  updatePaymentStatusValidation,
  updateOrderStatusValidation,
  validate,
} from "./order.validation.js";
import { protect, restrictTo, optionalAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Order creation supports both authenticated users and guests
router.post(
  "/",
  optionalAuth,
  validate(createOrderValidation),
  OrderController.createOrder
);

// Public tokenized download route for digital book delivery
router.get("/download/:token", OrderController.downloadByToken);

// All remaining order routes require authentication
router.use(protect);

// User routes
router.get("/my-orders", validate(getMyOrdersValidation), OrderController.getMyOrders);
router.get("/:id", validate(getOrderByIdValidation), OrderController.getOrderById);

// Admin only routes
router.get("/", restrictTo("admin"), validate(getOrdersValidation), OrderController.getAllOrders);
router.patch(
  "/:id/payment-status",
  restrictTo("admin"),
  validate(updatePaymentStatusValidation),
  OrderController.updatePaymentStatus
);
router.patch(
  "/:id/order-status",
  restrictTo("admin"),
  validate(updateOrderStatusValidation),
  OrderController.updateOrderStatus
);

export const OrderRoutes = router;
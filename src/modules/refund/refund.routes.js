import express from "express";
import { RefundController } from "./refund.controller.js";
import {
  createRefundRequestValidation,
  getRefundByIdValidation,
  getMyRefundsValidation,
  adminGetRefundsValidation,
  adminGetRefundByIdValidation,
  approveRefundValidation,
  rejectRefundValidation,
  validate,
} from "./refund.validation.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";

const router = express.Router();

// ==================== USER ROUTES ====================
router.use(protect);

// Create refund request
router.post(
  "/",
  validate(createRefundRequestValidation),
  RefundController.createRefundRequest
);

// Get my refunds
router.get(
  "/my-refunds",
  validate(getMyRefundsValidation),
  RefundController.getMyRefunds
);

// Get refund by ID
router.get(
  "/:id",
  validate(getRefundByIdValidation),
  RefundController.getRefundById
);

// ==================== ADMIN ROUTES ====================

// Get all refunds (admin)
router.get(
  "/admin/refunds",
  restrictTo("admin"),
  validate(adminGetRefundsValidation),
  RefundController.adminGetAllRefunds
);

// Get refund by ID (admin)
router.get(
  "/admin/refunds/:id",
  restrictTo("admin"),
  validate(adminGetRefundByIdValidation),
  RefundController.adminGetRefundById
);

// Approve refund (admin)
router.patch(
  "/admin/refunds/:id/approve",
  restrictTo("admin"),
  validate(approveRefundValidation),
  RefundController.adminApproveRefund
);

// Reject refund (admin)
router.patch(
  "/admin/refunds/:id/reject",
  restrictTo("admin"),
  validate(rejectRefundValidation),
  RefundController.adminRejectRefund
);

export const RefundRoutes = router;
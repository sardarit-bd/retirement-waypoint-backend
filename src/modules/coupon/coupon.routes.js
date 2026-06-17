import express from "express";
import { CouponController } from "./coupon.controller.js";
import {
  createCouponValidation,
  updateCouponValidation,
  getCouponsValidation,
  getCouponByIdValidation,
  validateCouponValidation,
  deleteCouponValidation,
  getCouponUsageValidation,
  validate,
} from "./coupon.validation.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
// Validate coupon (no auth required for validation)
router.post(
  "/validate",
  validate(validateCouponValidation),
  CouponController.validateCoupon
);

// ==================== ADMIN ROUTES ====================
router.use(protect, restrictTo("admin"));

// Create coupon
router.post(
  "/admin/coupons",
  validate(createCouponValidation),
  CouponController.createCoupon
);

// Get all coupons
router.get(
  "/admin/coupons",
  validate(getCouponsValidation),
  CouponController.getAllCoupons
);

// Get coupon by ID
router.get(
  "/admin/coupons/:id",
  validate(getCouponByIdValidation),
  CouponController.getCouponById
);

// Update coupon
router.patch(
  "/admin/coupons/:id",
  validate(updateCouponValidation),
  CouponController.updateCoupon
);

// Activate coupon
router.patch(
  "/admin/coupons/:id/activate",
  validate(getCouponByIdValidation),
  CouponController.activateCoupon
);

// Deactivate coupon
router.patch(
  "/admin/coupons/:id/deactivate",
  validate(getCouponByIdValidation),
  CouponController.deactivateCoupon
);

// Delete coupon
router.delete(
  "/admin/coupons/:id",
  validate(deleteCouponValidation),
  CouponController.deleteCoupon
);

// Get coupon usage
router.get(
  "/admin/coupons/:id/usage",
  validate(getCouponUsageValidation),
  CouponController.getCouponUsage
);

export const CouponRoutes = router;
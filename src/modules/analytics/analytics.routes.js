import express from "express";
import { AnalyticsController } from "./analytics.controller.js";
import {
  getOverviewValidation,
  getRevenueAnalyticsValidation,
  getOrderAnalyticsValidation,
  getBookAnalyticsValidation,
  getPurchaseAnalyticsValidation,
  getDownloadAnalyticsValidation,
  getReviewAnalyticsValidation,
  getCouponAnalyticsValidation,
  getUserAnalyticsValidation,
  validate,
} from "./analytics.validation.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";

const router = express.Router();

// All analytics routes require admin authentication
router.use(protect, restrictTo("admin"));

// Overview Dashboard
router.get(
  "/overview",
  validate(getOverviewValidation),
  AnalyticsController.getOverview
);

// Revenue Analytics
router.get(
  "/revenue",
  validate(getRevenueAnalyticsValidation),
  AnalyticsController.getRevenueAnalytics
);

// Order Analytics
router.get(
  "/orders",
  validate(getOrderAnalyticsValidation),
  AnalyticsController.getOrderAnalytics
);

// Book Analytics
router.get(
  "/books",
  validate(getBookAnalyticsValidation),
  AnalyticsController.getBookAnalytics
);

// Purchase Analytics
router.get(
  "/purchases",
  validate(getPurchaseAnalyticsValidation),
  AnalyticsController.getPurchaseAnalytics
);

// Download Analytics
router.get(
  "/downloads",
  validate(getDownloadAnalyticsValidation),
  AnalyticsController.getDownloadAnalytics
);

// Review Analytics
router.get(
  "/reviews",
  validate(getReviewAnalyticsValidation),
  AnalyticsController.getReviewAnalytics
);

// Coupon Analytics
router.get(
  "/coupons",
  validate(getCouponAnalyticsValidation),
  AnalyticsController.getCouponAnalytics
);

// User Analytics
router.get(
  "/users",
  validate(getUserAnalyticsValidation),
  AnalyticsController.getUserAnalytics
);

export const AnalyticsRoutes = router;
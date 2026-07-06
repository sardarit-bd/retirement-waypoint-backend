import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import AnalyticsService from "./analytics.service.js";

/**
 * Get overview dashboard data
 * GET /api/admin/analytics/overview
 */
const getOverview = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const data = await AnalyticsService.getOverview(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Overview analytics retrieved successfully",
    data,
  });
});

/**
 * Get revenue analytics
 * GET /api/admin/analytics/revenue
 */
const getRevenueAnalytics = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const data = await AnalyticsService.getRevenueAnalytics(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Revenue analytics retrieved successfully",
    data,
  });
});

/**
 * Get order analytics
 * GET /api/admin/analytics/orders
 */
const getOrderAnalytics = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const data = await AnalyticsService.getOrderAnalytics(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order analytics retrieved successfully",
    data,
  });
});

/**
 * Get book analytics
 * GET /api/admin/analytics/books
 */
const getBookAnalytics = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const data = await AnalyticsService.getBookAnalytics(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Book analytics retrieved successfully",
    data,
  });
});

/**
 * Get purchase analytics
 * GET /api/admin/analytics/purchases
 */
const getPurchaseAnalytics = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const data = await AnalyticsService.getPurchaseAnalytics(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Purchase analytics retrieved successfully",
    data,
  });
});

/**
 * Get download analytics
 * GET /api/admin/analytics/downloads
 */
const getDownloadAnalytics = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const data = await AnalyticsService.getDownloadAnalytics(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Download analytics retrieved successfully",
    data,
  });
});

/**
 * Get review analytics
 * GET /api/admin/analytics/reviews
 */
const getReviewAnalytics = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const data = await AnalyticsService.getReviewAnalytics(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Review analytics retrieved successfully",
    data,
  });
});

/**
 * Get coupon analytics
 * GET /api/admin/analytics/coupons
 */
const getCouponAnalytics = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const data = await AnalyticsService.getCouponAnalytics(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Coupon analytics retrieved successfully",
    data,
  });
});

/**
 * Get user analytics
 * GET /api/admin/analytics/users
 */
const getUserAnalytics = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const data = await AnalyticsService.getUserAnalytics(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User analytics retrieved successfully",
    data,
  });
});

export const AnalyticsController = {
  getOverview,
  getRevenueAnalytics,
  getOrderAnalytics,
  getBookAnalytics,
  getPurchaseAnalytics,
  getDownloadAnalytics,
  getReviewAnalytics,
  getCouponAnalytics,
  getUserAnalytics,
};
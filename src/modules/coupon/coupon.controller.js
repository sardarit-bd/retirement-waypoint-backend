import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import CouponService from "./coupon.service.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Create coupon (admin)
 * POST /api/admin/coupons
 */
const createCoupon = catchAsync(async (req, res) => {
  const coupon = await CouponService.createCoupon(req.body, req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Coupon created successfully",
    data: coupon,
  });
});

/**
 * Update coupon (admin)
 * PATCH /api/admin/coupons/:id
 */
const updateCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;
  const coupon = await CouponService.updateCoupon(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Coupon updated successfully",
    data: coupon,
  });
});

/**
 * Activate coupon (admin)
 * PATCH /api/admin/coupons/:id/activate
 */
const activateCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;
  const coupon = await CouponService.activateCoupon(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Coupon activated successfully",
    data: coupon,
  });
});

/**
 * Deactivate coupon (admin)
 * PATCH /api/admin/coupons/:id/deactivate
 */
const deactivateCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;
  const coupon = await CouponService.deactivateCoupon(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Coupon deactivated successfully",
    data: coupon,
  });
});

/**
 * Get all coupons (admin)
 * GET /api/admin/coupons
 */
const getAllCoupons = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await CouponService.getAllCoupons(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Coupons retrieved successfully",
    data: result.coupons,
    meta: result.pagination,
  });
});

/**
 * Get coupon by ID (admin)
 * GET /api/admin/coupons/:id
 */
const getCouponById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const coupon = await CouponService.getCouponById(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Coupon retrieved successfully",
    data: coupon,
  });
});

/**
 * Delete coupon (admin)
 * DELETE /api/admin/coupons/:id
 */
const deleteCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CouponService.deleteCoupon(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: result.message,
    data: null,
  });
});

/**
 * Get coupon usage history (admin)
 * GET /api/admin/coupons/:id/usage
 */
const getCouponUsage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const query = req.validatedQuery || req.query;
  const result = await CouponService.getCouponUsage(id, query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Coupon usage retrieved successfully",
    data: result.usages,
    meta: result.pagination,
  });
});

/**
 * Validate coupon (public)
 * POST /api/coupons/validate
 */
const validateCoupon = catchAsync(async (req, res) => {
  const { code, subtotal } = req.body;
  const userId = req.user?.id || null;

  const result = await CouponService.validateCoupon(code, userId, subtotal);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Coupon validated successfully",
    data: result,
  });
});

export const CouponController = {
  createCoupon,
  updateCoupon,
  activateCoupon,
  deactivateCoupon,
  getAllCoupons,
  getCouponById,
  deleteCoupon,
  getCouponUsage,
  validateCoupon,
};
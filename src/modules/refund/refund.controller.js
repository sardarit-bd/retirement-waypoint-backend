import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import RefundService from "./refund.service.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Create refund request (user)
 * POST /api/refunds
 */
const createRefundRequest = catchAsync(async (req, res) => {
  const refund = await RefundService.createRefundRequest(req.user.id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Refund request submitted successfully",
    data: refund,
  });
});

/**
 * Get my refunds (user)
 * GET /api/refunds/my-refunds
 */
const getMyRefunds = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await RefundService.getUserRefunds(req.user.id, query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Refunds retrieved successfully",
    data: result.refunds,
    meta: result.pagination,
  });
});

/**
 * Get refund by ID (user)
 * GET /api/refunds/:id
 */
const getRefundById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const refund = await RefundService.getRefundById(id, req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Refund retrieved successfully",
    data: refund,
  });
});

/**
 * Admin: Get all refunds
 * GET /api/admin/refunds
 */
const adminGetAllRefunds = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await RefundService.adminGetAllRefunds(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Refunds retrieved successfully",
    data: result.refunds,
    meta: result.pagination,
  });
});

/**
 * Admin: Get refund by ID
 * GET /api/admin/refunds/:id
 */
const adminGetRefundById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const refund = await RefundService.adminGetRefundById(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Refund retrieved successfully",
    data: refund,
  });
});

/**
 * Admin: Approve refund
 * PATCH /api/admin/refunds/:id/approve
 */
const adminApproveRefund = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body;
  const refund = await RefundService.approveRefund(id, req.user.id, adminNotes);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Refund approved and processed successfully",
    data: refund,
  });
});

/**
 * Admin: Reject refund
 * PATCH /api/admin/refunds/:id/reject
 */
const adminRejectRefund = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body;
  const refund = await RefundService.rejectRefund(id, req.user.id, adminNotes);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Refund rejected successfully",
    data: refund,
  });
});

export const RefundController = {
  createRefundRequest,
  getMyRefunds,
  getRefundById,
  adminGetAllRefunds,
  adminGetRefundById,
  adminApproveRefund,
  adminRejectRefund,
};
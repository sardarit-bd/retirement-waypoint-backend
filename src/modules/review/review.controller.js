// import catchAsync from "../../utils/catchAsync.js";
// import sendResponse from "../../utils/sendResponse.js";
// import ReviewService from "./review.service.js";
// import ApiError from "../../utils/ApiError.js";

import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import ReviewService from "./review.service.js";

/**
 * Create review
 * POST /api/reviews
 */
const createReview = catchAsync(async (req, res) => {
  const review = await ReviewService.createReview(req.user.id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Review submitted successfully. It will be visible after admin approval.",
    data: review,
  });
});

/**
 * Update review
 * PATCH /api/reviews/:id
 */
const updateReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const review = await ReviewService.updateReview(id, req.user.id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Review updated successfully. It will be reviewed again by admin.",
    data: review,
  });
});

/**
 * Delete review
 * DELETE /api/reviews/:id
 */
const deleteReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ReviewService.deleteReview(id, req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: result.message,
    data: null,
  });
});

/**
 * Get my reviews
 * GET /api/reviews/my-reviews
 */
const getMyReviews = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await ReviewService.getUserReviews(req.user.id, query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Reviews retrieved successfully",
    data: result.reviews,
    meta: result.pagination,
  });
});

/**
 * Get review by ID
 * GET /api/reviews/:id
 */
const getReviewById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === "admin";
  const review = await ReviewService.getReviewById(id, req.user.id, isAdmin);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Review retrieved successfully",
    data: review,
  });
});

/**
 * Admin: Get all reviews
 * GET /api/admin/reviews
 */
const adminGetAllReviews = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await ReviewService.getAllReviews(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Reviews retrieved successfully",
    data: result.reviews,
    meta: result.pagination,
  });
});

/**
 * Admin: Approve review
 * PATCH /api/admin/reviews/:id/approve
 */
const adminApproveReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const review = await ReviewService.approveReview(id, req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Review approved successfully",
    data: review,
  });
});

/**
 * Admin: Reject review
 * PATCH /api/admin/reviews/:id/reject
 */
const adminRejectReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ReviewService.rejectReview(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: result.message,
    data: null,
  });
});

/**
 * Admin: Delete review
 * DELETE /api/admin/reviews/:id
 */
const adminDeleteReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ReviewService.deleteReview(id, null, true);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: result.message,
    data: null,
  });
});

/**
 * Public: Get book reviews
 * GET /api/books/:bookId/reviews
 */
const getBookReviews = catchAsync(async (req, res) => {
  const { bookId } = req.params;
  const query = req.validatedQuery || req.query;
  const result = await ReviewService.getBookReviews(bookId, query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Reviews retrieved successfully",
    data: result.reviews,
    meta: result.pagination,
  });
});

/**
 * Public: Get review summary
 * GET /api/books/:bookId/reviews/summary
 */
const getReviewSummary = catchAsync(async (req, res) => {
  const { bookId } = req.params;
  const summary = await ReviewService.getReviewSummary(bookId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Review summary retrieved successfully",
    data: summary,
  });
});

export const ReviewController = {
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  getReviewById,
  adminGetAllReviews,
  adminApproveReview,
  adminRejectReview,
  adminDeleteReview,
  getBookReviews,
  getReviewSummary,
};
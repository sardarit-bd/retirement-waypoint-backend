import express from "express";
import { protect, optionalAuth, restrictTo } from "../../middleware/authMiddleware.js";
import {
  adminGetReviewsValidation,
  approveReviewValidation,
  createReviewValidation,
  deleteReviewValidation,
  getBookReviewsValidation,
  getMyReviewsValidation,
  getReviewByIdValidation,
  getReviewSummaryValidation,
  rejectReviewValidation,
  updateReviewStatusValidation,
  updateReviewValidation,
  verifyReviewTokenValidation,
  validate,
} from "./review.validation.js";
import { ReviewController } from "./review.controller.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Verify guest review token
router.get(
  "/verify-token",
  validate(verifyReviewTokenValidation),
  ReviewController.verifyToken,
);

// Get book reviews (public - approved only)
router.get(
  "/books/:bookId/reviews",
  validate(getBookReviewsValidation),
  ReviewController.getBookReviews,
);

// Get review summary (public)
router.get(
  "/books/:bookId/reviews/summary",
  validate(getReviewSummaryValidation),
  ReviewController.getReviewSummary,
);

// Create review (supports authenticated users OR guests with valid reviewToken + orderId)
router.post(
  "/",
  optionalAuth,
  validate(createReviewValidation),
  ReviewController.createReview,
);

// ==================== PROTECTED ROUTES ====================

router.use(protect);

// Get current user's review for a book
router.get(
  "/my-review/:bookId",
  ReviewController.getMyReview,
);

// Update review
router.patch(
  "/:id",
  validate(updateReviewValidation),
  ReviewController.updateReview,
);

// Delete review
router.delete(
  "/:id",
  validate(deleteReviewValidation),
  ReviewController.deleteReview,
);

// Get my reviews
router.get(
  "/my-reviews",
  validate(getMyReviewsValidation),
  ReviewController.getMyReviews,
);

// Get review by ID
router.get(
  "/:id",
  validate(getReviewByIdValidation),
  ReviewController.getReviewById,
);

// ==================== ADMIN ROUTES (mounted under /reviews/admin/reviews) ====================

// Get all reviews (admin)
router.get(
  "/admin/reviews",
  restrictTo("admin"),
  validate(adminGetReviewsValidation),
  ReviewController.adminGetAllReviews,
);

// Approve review (admin)
router.patch(
  "/admin/reviews/:id/approve",
  restrictTo("admin"),
  validate(approveReviewValidation),
  ReviewController.adminApproveReview,
);

// Reject review (admin)
router.patch(
  "/admin/reviews/:id/reject",
  restrictTo("admin"),
  validate(rejectReviewValidation),
  ReviewController.adminRejectReview,
);

// Update review status (admin) - APPROVED or REJECTED
router.patch(
  "/admin/reviews/:id/status",
  restrictTo("admin"),
  validate(updateReviewStatusValidation),
  ReviewController.adminUpdateReviewStatus,
);

router.patch(
  "/admin/reviews/:reviewId/status",
  restrictTo("admin"),
  validate(updateReviewStatusValidation),
  ReviewController.adminUpdateReviewStatus,
);

// Delete review (admin)
router.delete(
  "/admin/reviews/:id",
  restrictTo("admin"),
  validate(deleteReviewValidation),
  ReviewController.adminDeleteReview,
);

export const ReviewRoutes = router;

// ==================== DIRECT ADMIN ROUTER (mounted under /admin/reviews) ====================
const directAdminRouter = express.Router();
directAdminRouter.use(protect, restrictTo("admin"));

directAdminRouter.get(
  "/",
  validate(adminGetReviewsValidation),
  ReviewController.adminGetAllReviews,
);

directAdminRouter.patch(
  "/:id/approve",
  validate(approveReviewValidation),
  ReviewController.adminApproveReview,
);

directAdminRouter.patch(
  "/:id/reject",
  validate(rejectReviewValidation),
  ReviewController.adminRejectReview,
);

directAdminRouter.patch(
  "/:id/status",
  validate(updateReviewStatusValidation),
  ReviewController.adminUpdateReviewStatus,
);

directAdminRouter.patch(
  "/:reviewId/status",
  validate(updateReviewStatusValidation),
  ReviewController.adminUpdateReviewStatus,
);

directAdminRouter.delete(
  "/:id",
  validate(deleteReviewValidation),
  ReviewController.adminDeleteReview,
);

export const ReviewAdminRoutes = directAdminRouter;
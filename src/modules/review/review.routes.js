import express from "express";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";
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
  updateReviewValidation,
  validate,
} from "./review.validation.js";
import { ReviewController } from "./review.controller.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

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

// ==================== PROTECTED ROUTES ====================

router.use(protect);

// Get current user's review for a book
router.get(
  "/my-review/:bookId",
  ReviewController.getMyReview,
);

// Create review
router.post(
  "/",
  validate(createReviewValidation),
  ReviewController.createReview,
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

// ==================== ADMIN ROUTES ====================

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

// Delete review (admin)
router.delete(
  "/admin/reviews/:id",
  restrictTo("admin"),
  validate(deleteReviewValidation),
  ReviewController.adminDeleteReview,
);

export const ReviewRoutes = router;
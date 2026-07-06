import { z } from "zod";

// Create review validation
export const createReviewValidation = z.object({
  body: z.object({
    bookId: z.string().min(1, "Book ID is required"),
    rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
    title: z.string().min(1, "Title is required").max(150, "Title cannot exceed 150 characters"),
    comment: z.string().min(1, "Comment is required").max(2000, "Comment cannot exceed 2000 characters"),
  }),
});

// Update review validation
export const updateReviewValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Review ID is required"),
  }),
  body: z.object({
    rating: z.number().min(1).max(5).optional(),
    title: z.string().min(1).max(150).optional(),
    comment: z.string().min(1).max(2000).optional(),
  }),
});

// Get my reviews validation
export const getMyReviewsValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(["createdAt", "rating"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Get review by ID validation
export const getReviewByIdValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Review ID is required"),
  }),
});

// Delete review validation
export const deleteReviewValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Review ID is required"),
  }),
});

// Admin: Get all reviews validation
export const adminGetReviewsValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    rating: z.coerce.number().min(1).max(5).optional(),
    approved: z.enum(["true", "false"]).optional(),
    bookId: z.string().optional(),
    userId: z.string().optional(),
    sortBy: z.enum(["createdAt", "rating", "updatedAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Admin: Approve review validation
export const approveReviewValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Review ID is required"),
  }),
});

// Admin: Reject review validation
export const rejectReviewValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Review ID is required"),
  }),
});

// Public: Get book reviews validation
export const getBookReviewsValidation = z.object({
  params: z.object({
    bookId: z.string().min(1, "Book ID is required"),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(["createdAt", "rating"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Public: Get review summary validation
export const getReviewSummaryValidation = z.object({
  params: z.object({
    bookId: z.string().min(1, "Book ID is required"),
  }),
});

// Validate middleware helper
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      if (schema.query) {
        req.validatedQuery = await schema.query.parseAsync(req.query);
      }
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
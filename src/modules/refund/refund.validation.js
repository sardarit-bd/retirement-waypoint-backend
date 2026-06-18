import { z } from "zod";

// Create refund request validation
export const createRefundRequestValidation = z.object({
  body: z.object({
    orderId: z.string().min(1, "Order ID is required"),
    reason: z.string().min(1, "Reason is required").max(500, "Reason cannot exceed 500 characters"),
    details: z.string().max(2000, "Details cannot exceed 2000 characters").optional(),
  }),
});

// Get refund by ID validation
export const getRefundByIdValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Refund ID is required"),
  }),
});

// Get my refunds validation
export const getMyRefundsValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED"]).optional(),
    sortBy: z.enum(["requestedAt", "status", "refundAmount"]).default("requestedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Admin: Get all refunds validation
export const adminGetRefundsValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED"]).optional(),
    sortBy: z.enum(["requestedAt", "status", "refundAmount"]).default("requestedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Admin: Approve refund validation
export const approveRefundValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Refund ID is required"),
  }),
  body: z.object({
    adminNotes: z.string().max(1000, "Admin notes cannot exceed 1000 characters").optional(),
  }),
});

// Admin: Reject refund validation
export const rejectRefundValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Refund ID is required"),
  }),
  body: z.object({
    adminNotes: z.string().min(1, "Rejection reason is required").max(1000, "Admin notes cannot exceed 1000 characters"),
  }),
});

// Admin: Get refund details validation
export const adminGetRefundByIdValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Refund ID is required"),
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
import { z } from "zod";

// Get user purchases validation
export const getUserPurchasesValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(["purchasedAt", "createdAt"]).default("purchasedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Check purchase by book validation
export const checkPurchaseByBookValidation = z.object({
  params: z.object({
    bookId: z.string().min(1, "Book ID is required"),
  }),
});

// Get purchase by ID validation
export const getPurchaseByIdValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Purchase ID is required"),
  }),
});

// Get all purchases validation (admin)
export const getAllPurchasesValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    userId: z.string().optional(),
    bookId: z.string().optional(),
    accessStatus: z.enum(["ACTIVE", "REVOKED"]).optional(),
    sortBy: z.enum(["purchasedAt", "createdAt"]).default("purchasedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Revoke access validation (admin)
export const revokeAccessValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Purchase ID is required"),
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
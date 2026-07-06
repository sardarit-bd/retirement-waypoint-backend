import { z } from "zod";

// Create coupon validation
export const createCouponValidation = z.object({
  body: z.object({
    code: z.string().min(3, "Code must be at least 3 characters").max(50, "Code cannot exceed 50 characters"),
    name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
    description: z.string().max(500).optional(),
    type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    value: z.number().positive("Value must be greater than 0"),
    minimumOrderAmount: z.number().min(0).default(0),
    maximumDiscountAmount: z.number().positive().optional().nullable(),
    usageLimit: z.number().int().positive().optional().nullable(),
    perUserLimit: z.number().int().positive().default(1),
    validFrom: z.string().datetime().optional(),
    expiresAt: z.string().datetime(),
    isActive: z.boolean().default(true),
  }),
});

// Update coupon validation
export const updateCouponValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Coupon ID is required"),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    value: z.number().positive().optional(),
    minimumOrderAmount: z.number().min(0).optional(),
    maximumDiscountAmount: z.number().positive().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    perUserLimit: z.number().int().positive().optional(),
    validFrom: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
  }),
});

// Get coupons validation (admin)
export const getCouponsValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
    isActive: z.enum(["true", "false"]).optional(),
    expired: z.enum(["true", "false"]).optional(),
    sortBy: z.enum(["createdAt", "value", "usedCount", "expiresAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Get coupon by ID validation
export const getCouponByIdValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Coupon ID is required"),
  }),
});

// Validate coupon validation (public)
export const validateCouponValidation = z.object({
  body: z.object({
    code: z.string().min(1, "Coupon code is required"),
    subtotal: z.number().min(0, "Subtotal cannot be negative"),
  }),
});

// Delete coupon validation
export const deleteCouponValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Coupon ID is required"),
  }),
});

// Get coupon usage validation
export const getCouponUsageValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Coupon ID is required"),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
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
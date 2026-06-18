import { z } from "zod";

// Overview validation
export const getOverviewValidation = z.object({
  query: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});

// Revenue analytics validation
export const getRevenueAnalyticsValidation = z.object({
  query: z.object({
    period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});

// Order analytics validation
export const getOrderAnalyticsValidation = z.object({
  query: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});

// Book analytics validation
export const getBookAnalyticsValidation = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z.enum(["sales", "purchases", "downloads", "rating"]).default("sales"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Purchase analytics validation
export const getPurchaseAnalyticsValidation = z.object({
  query: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});

// Download analytics validation
export const getDownloadAnalyticsValidation = z.object({
  query: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
});

// Review analytics validation
export const getReviewAnalyticsValidation = z.object({
  query: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});

// Coupon analytics validation
export const getCouponAnalyticsValidation = z.object({
  query: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
});

// User analytics validation
export const getUserAnalyticsValidation = z.object({
  query: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10),
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
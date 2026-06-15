import { z } from "zod";

// Create order validation
export const createOrderValidation = z.object({
  body: z.object({
    items: z.array(
      z.object({
        bookId: z.string().min(1, "Book ID is required"),
        // bookTitle and bookPrice REMOVED - will be fetched from DB
      }),
    ),
    notes: z.string().max(500).optional(),
  }),
});

// Get order by ID validation
export const getOrderByIdValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Order ID is required"),
  }),
});

// Get orders query validation (admin)
export const getOrdersValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
    orderStatus: z
      .enum(["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"])
      .optional(),
    sortBy: z
      .enum(["createdAt", "totalAmount", "orderNumber"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Get my orders validation (user)
export const getMyOrdersValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z
      .enum(["createdAt", "totalAmount", "orderNumber"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Update payment status validation
export const updatePaymentStatusValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Order ID is required"),
  }),
  body: z.object({
    paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]),
    stripeSessionId: z.string().optional(),
    stripePaymentIntentId: z.string().optional(),
  }),
});

// Update order status validation
export const updateOrderStatusValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Order ID is required"),
  }),
  body: z.object({
    orderStatus: z.enum(["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"]),
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

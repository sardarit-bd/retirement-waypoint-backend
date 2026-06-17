import { z } from "zod";

// Get my books validation
export const getMyBooksValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    sortBy: z.enum(["purchasedAt", "title", "authorName"]).default("purchasedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Get book by ID validation
export const getMyBookByIdValidation = z.object({
  params: z.object({
    bookId: z.string().min(1, "Book ID is required"),
  }),
});

// Download book validation
export const downloadBookValidation = z.object({
  params: z.object({
    bookId: z.string().min(1, "Book ID is required"),
  }),
});

// Admin: Get download logs validation
export const getDownloadLogsValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    userId: z.string().optional(),
    bookId: z.string().optional(),
    sortBy: z.enum(["downloadedAt", "userId", "bookId"]).default("downloadedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Admin: Get download stats validation
export const getDownloadStatsValidation = z.object({
  query: z.object({
    bookId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
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
import { z } from "zod";

// Get my invoices validation
export const getMyInvoicesValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(["ISSUED", "PAID", "REFUNDED"]).optional(),
    sortBy: z.enum(["issuedAt", "totalAmount", "invoiceNumber"]).default("issuedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Get invoice by ID validation
export const getInvoiceByIdValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Invoice ID is required"),
  }),
});

// Get invoice by invoice number validation
export const getInvoiceByNumberValidation = z.object({
  params: z.object({
    invoiceNumber: z.string().min(1, "Invoice number is required"),
  }),
});

// Admin get all invoices validation
export const adminGetInvoicesValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.enum(["ISSUED", "PAID", "REFUNDED"]).optional(),
    sortBy: z.enum(["issuedAt", "totalAmount", "invoiceNumber"]).default("issuedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
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
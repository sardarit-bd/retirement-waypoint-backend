import { z } from "zod";
import { NEWSLETTER_STATUS, NEWSLETTER_SOURCE } from "./newsletter.model.js";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email format")
  .max(255, "Email cannot exceed 255 characters")
  .toLowerCase();

// Public: subscribe
export const subscribeValidation = z.object({
  body: z
    .object({
      email: emailSchema,
      source: z.enum(Object.values(NEWSLETTER_SOURCE)).optional(),
    })
    .strict(),
});

// Admin: list subscribers with search/filter/pagination
export const getSubscribersValidation = z.object({
  query: z
    .object({
      page: z
        .string()
        .regex(/^\d+$/, "Page must be a positive integer")
        .transform(Number)
        .default("1"),
      limit: z
        .string()
        .regex(/^\d+$/, "Limit must be a positive integer")
        .transform(Number)
        .default("10"),
      search: z.string().trim().max(255).optional(),
      status: z.enum(Object.values(NEWSLETTER_STATUS)).optional(),
    })
    .partial({ page: true, limit: true }),
});

// Admin: export subscribers
export const exportSubscribersValidation = z.object({
  query: z
    .object({
      format: z.enum(["csv", "excel"]).default("csv"),
      status: z.enum(Object.values(NEWSLETTER_STATUS)).optional(),
      search: z.string().trim().max(255).optional(),
    })
    .partial({ format: true }),
});

// Admin: get / delete by id
export const subscriberIdParamValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid subscriber ID format"),
  }),
});

// Admin: update status (activate / unsubscribe)
export const updateSubscriberStatusValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid subscriber ID format"),
  }),
  body: z
    .object({
      status: z.enum(Object.values(NEWSLETTER_STATUS), {
        errorMap: () => ({ message: "Invalid status value" }),
      }),
    })
    .strict(),
});

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
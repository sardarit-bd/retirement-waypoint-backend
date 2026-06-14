import { z } from "zod";

export const updateProfileValidation = z.object({
  body: z.object({
    phone: z.string().trim().min(5).max(30).optional(),
    bio: z.string().trim().max(500).optional(),
    preferences: z
      .object({
        newsletter: z.boolean().optional(),
        notifications: z.boolean().optional(),
      })
      .optional(),
  }).strict(),
});

export const updateRoleValidation = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    role: z.enum(["user", "admin", "coach"]),
  }),
});

export const getUsersValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    role: z.enum(["user", "admin", "coach"]).optional(),
    search: z.string().trim().max(100).optional(),
  }),
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

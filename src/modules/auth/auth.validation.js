import { z } from "zod";

export const updateProfileValidation = z.object({
  body: z.object({
    phone: z.string().optional(),
    bio: z.string().max(500).optional(),
    profileImage: z.string().url().optional(),
    preferences: z.object({
      newsletter: z.boolean().optional(),
      notifications: z.boolean().optional(),
    }).optional(),
  }),
});

export const updateRoleValidation = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    role: z.enum(["user", "admin", "coach"]),
  }),
});

export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
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
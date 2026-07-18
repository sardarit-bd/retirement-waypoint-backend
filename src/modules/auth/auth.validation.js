import { z } from "zod";

// A valid US phone number is exactly 10 digits, or 11 digits with a
// leading country code of 1 - regardless of how it's punctuated
// (spaces, dashes, parens, a leading "+") when the request is made.
const isValidUSPhoneDigits = (value) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
};

export const updateProfileValidation = z.object({
  body: z.object({
    name: z.string().trim().min(3).max(100).optional(),
    phone: z
      .string()
      .trim()
      .max(20, "Phone number is too long")
      .optional()
      .refine((val) => !val || isValidUSPhoneDigits(val), {
        message:
          "Please enter a valid US phone number, e.g. (555) 123-4567 or +1 (555) 123-4567",
      }),
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
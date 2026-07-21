import { z } from 'zod';

// Landing schema
const landingSchema = z.object({
  badge: z.string()
    .min(1, 'Badge is required')
    .max(100, 'Badge cannot exceed 100 characters')
    .trim()
    .optional(),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .trim()
    .optional(),
  subtitle: z.string()
    .min(1, 'Subtitle is required')
    .max(500, 'Subtitle cannot exceed 500 characters')
    .trim()
    .optional(),
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),
});

// Validation for updating landing
export const updateLandingValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  }),
  body: landingSchema,
});

// Validation for ID param
export const idParamValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
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
import { z } from 'zod';

// Validation for getting participants with filters
export const getParticipantsValidation = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    search: z.string().optional(),
    assessmentSlug: z.string().optional(),
    resultRange: z.string().optional(),
    sortBy: z.enum(['newest', 'oldest', 'highestScore', 'lowestScore', 'nameAZ', 'nameZA']).default('newest'),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});

// Validation for getting participant by ID
export const getParticipantByIdValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid submission ID format'),
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
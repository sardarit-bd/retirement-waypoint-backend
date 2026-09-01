import { z } from 'zod';

const domainItemSchema = z.object({
  tag: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  iconName: z.string().optional(),
});

export const updateCoachingCmsValidation = z.object({
  body: z
    .object({
      hero: z
        .object({
          badge: z.string().optional(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
        })
        .passthrough()
        .optional(),
      overview: z
        .object({
          badge: z.string().optional(),
          headline: z.string().optional(),
          paragraphs: z.array(z.string()).optional(),
        })
        .passthrough()
        .optional(),
      framework: z
        .object({
          badge: z.string().optional(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
          domains: z.array(domainItemSchema).optional(),
        })
        .passthrough()
        .optional(),
      assessmentNote: z
        .object({
          noteText: z.string().optional(),
        })
        .passthrough()
        .optional(),
      eligibility: z
        .object({
          boxTitle: z.string().optional(),
          points: z.array(z.string()).optional(),
        })
        .passthrough()
        .optional(),
      cta: z
        .object({
          buttonText: z.string().optional(),
          buttonLink: z.string().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough(),
});

export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = parsed.body || req.body;
      req.params = parsed.params || req.params;

      if (parsed.query && req.query) {
        Object.keys(req.query).forEach((k) => {
          if (!(k in parsed.query)) delete req.query[k];
        });
        Object.assign(req.query, parsed.query);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

import { z } from 'zod';

const trustPointSchema = z
  .object({
    iconName: z.string().optional().default('TrendingUp'),
    text: z.string().optional().default(''),
  })
  .passthrough();

const statItemSchema = z
  .object({
    iconName: z.string().optional().default('Briefcase'),
    value: z.string().optional().default(''),
    label: z.string().optional().default(''),
    description: z.string().optional().default(''),
  })
  .passthrough();

const stepItemSchema = z
  .object({
    iconName: z.string().optional().default('Target'),
    title: z.string().optional().default(''),
    description: z.string().optional().default(''),
  })
  .passthrough();

const supportItemSchema = z
  .object({
    iconName: z.string().optional().default('ClipboardCheck'),
    title: z.string().optional().default(''),
    description: z.string().optional().default(''),
  })
  .passthrough();

export const updateHomeCmsValidation = z.object({
  body: z
    .object({
      hero: z
        .object({
          badge: z.string().optional(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
          ctaText: z.string().optional(),
          ctaLink: z.string().optional(),
          backgroundImage: z.string().optional(),
          trustPoints: z.array(trustPointSchema).optional(),
        })
        .passthrough()
        .optional(),
      trust: z
        .object({
          badge: z.string().optional(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
          stats: z.array(statItemSchema).optional(),
        })
        .passthrough()
        .optional(),
      assessmentPreview: z
        .object({
          badge: z.string().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
          steps: z.array(stepItemSchema).optional(),
          sampleCard: z
            .object({
              questionNumber: z.string().optional(),
              progressPercent: z.string().optional(),
              questionText: z.string().optional(),
              options: z.array(z.string()).optional(),
              selectedOptionIndex: z.number().optional(),
              footerText: z.string().optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough()
        .optional(),
      support: z
        .object({
          backgroundImage: z.string().optional(),
          badge: z.string().optional(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
          items: z.array(supportItemSchema).optional(),
        })
        .passthrough()
        .optional(),
      newsletter: z
        .object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
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

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if (parsed.params !== undefined) {
        req.params = parsed.params;
      }
      if (parsed.query !== undefined) {
        req.validatedQuery = parsed.query;
        if (req.query && typeof req.query === 'object') {
          try {
            Object.keys(req.query).forEach((key) => delete req.query[key]);
            Object.assign(req.query, parsed.query);
          } catch {
            // Handle environments where req.query is getter-only
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

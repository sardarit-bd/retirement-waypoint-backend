import { z } from 'zod';

const valueItemSchema = z.object({
  iconName: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
});

export const updateAboutCmsValidation = z.object({
  body: z
    .object({
      hero: z
        .object({
          badge: z.string().optional(),
          title: z.string().optional(),
          bioParagraphs: z.array(z.string()).optional(),
          credentials: z.array(z.string()).optional(),
          profileImage: z.string().optional(),
        })
        .passthrough()
        .optional(),
      missionVision: z
        .object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          mission: z
            .object({
              title: z.string().optional(),
              description: z.string().optional(),
              iconName: z.string().optional(),
            })
            .passthrough()
            .optional(),
          vision: z
            .object({
              title: z.string().optional(),
              description: z.string().optional(),
              iconName: z.string().optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough()
        .optional(),
      coreValues: z
        .object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          values: z.array(valueItemSchema).optional(),
        })
        .passthrough()
        .optional(),
      quoteBanner: z
        .object({
          backgroundImage: z.string().optional(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
        })
        .passthrough()
        .optional(),
      finalCta: z
        .object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
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

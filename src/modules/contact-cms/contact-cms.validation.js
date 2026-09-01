import { z } from 'zod';

export const updateContactCmsValidation = z.object({
  body: z
    .object({
      header: z
        .object({
          badge: z.string().optional(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
        })
        .passthrough()
        .optional(),
      contactInfo: z
        .object({
          sectionTitle: z.string().optional(),
          sectionSubtitle: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
        })
        .passthrough()
        .optional(),
      promoCard: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          buttonText: z.string().optional(),
          buttonLink: z.string().optional(),
        })
        .passthrough()
        .optional(),
      formInfo: z
        .object({
          formTitle: z.string().optional(),
          formSubtitle: z.string().optional(),
          submitButtonText: z.string().optional(),
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

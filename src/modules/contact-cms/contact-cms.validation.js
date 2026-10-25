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

export { validate } from "../../middleware/validateMiddleware.js";

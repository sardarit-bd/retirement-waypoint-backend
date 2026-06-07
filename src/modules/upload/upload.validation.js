import { z } from 'zod';

export const uploadSingleValidation = z.object({
  body: z.object({
    folder: z.string().optional(),
    description: z.string().max(500).optional(),
    alt: z.string().max(200).optional(),
    transformations: z.string().optional()
  })
});

export const uploadMultipleValidation = z.object({
  body: z.object({
    folder: z.string().optional(),
    description: z.string().max(500).optional()
  })
});

export const updateFileInfoValidation = z.object({
  params: z.object({
    publicId: z.string().min(1, 'Public ID is required')
  }),
  body: z.object({
    description: z.string().max(500).optional(),
    alt: z.string().max(200).optional()
  })
});

export const deleteFileValidation = z.object({
  params: z.object({
    publicId: z.string().min(1, 'Public ID is required')
  })
});

export const getUserFilesValidation = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number),
    limit: z.string().regex(/^\d+$/).optional().transform(Number),
    fileType: z.enum(['image', 'document', 'video', 'other']).optional(),
    folder: z.string().optional()
  })
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
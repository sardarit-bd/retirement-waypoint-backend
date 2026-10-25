/**
 * Generic Request Validation Middleware using Zod
 * Supports:
 * - ZodObject schemas with shape.params, shape.query, shape.body
 * - Plain object schemas containing { params, query, body }
 * - Direct Zod schemas for body
 */
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      if (!schema) {
        return next();
      }

      const shape =
        schema.shape ||
        (typeof schema === "object" && schema !== null ? schema : null);

      if (shape && (shape.params || shape.query || shape.body)) {
        if (shape.params && typeof shape.params.parseAsync === "function") {
          req.params = await shape.params.parseAsync(req.params || {});
        }
        if (shape.query && typeof shape.query.parseAsync === "function") {
          const validatedQuery = await shape.query.parseAsync(req.query || {});
          req.validatedQuery = validatedQuery;
          if (req.query && typeof req.query === "object") {
            try {
              Object.assign(req.query, validatedQuery);
            } catch {
              // Ignore if req.query is read-only in this runtime
            }
          }
        }
        if (shape.body && typeof shape.body.parseAsync === "function") {
          req.body = await shape.body.parseAsync(req.body || {});
        }
      } else if (typeof schema.parseAsync === "function") {
        req.body = await schema.parseAsync(req.body || {});
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;

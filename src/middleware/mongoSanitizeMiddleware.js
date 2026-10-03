/**
 * In-place NoSQL Injection Sanitization Middleware
 * Removes keys starting with '$' or containing '.' from req.body, req.query, and req.params
 * Modifies objects in-place to avoid Express 5 'Cannot set property query' getter error.
 */
export const sanitizeMongoInput = (req, res, next) => {
  const clean = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key]; // Delete malicious keys
      } else {
        clean(obj[key]); // Recursively clean nested objects
      }
    }
  };

  if (req.body) clean(req.body);
  if (req.query) clean(req.query);
  if (req.params) clean(req.params);

  next();
};

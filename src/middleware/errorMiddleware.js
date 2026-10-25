import ApiError from "../utils/ApiError.js";
import multer from "multer";
import { ZodError } from "zod";


const errorMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.errors = err.errors || null;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'The requested resource was not found';
    error = new ApiError(404, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'record';
    const message = `A ${field} with this value already exists`;
    error = new ApiError(400, message, { [field]: `Already in use` });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const fieldErrors = {};
    const messages = [];

    if (err.errors) {
      for (const [field, val] of Object.entries(err.errors)) {
        let msg = val.message || 'Invalid value';
        // Clean up raw Mongoose validator syntax if not already customized
        if (typeof msg === 'string') {
          if (msg.includes('is shorter than the minimum allowed length')) {
            const minMatch = msg.match(/\((\d+)\)/);
            const min = minMatch ? minMatch[1] : '';
            msg = `Please enter at least ${min} characters for ${field}`;
          } else if (msg.includes('is longer than the maximum allowed length')) {
            const maxMatch = msg.match(/\((\d+)\)/);
            const max = maxMatch ? maxMatch[1] : '';
            msg = `${field} cannot exceed ${max} characters`;
          }
        }
        fieldErrors[field] = msg;
        messages.push(msg);
      }
    }

    const message = messages.join('. ') || 'Validation error';
    error = new ApiError(400, message, fieldErrors);
  }

  // Zod validation error
  if (err instanceof ZodError) {
    const fieldErrors = {};
    const messages = [];

    for (const issue of err.issues) {
      // Strip 'body', 'params', 'query' prefixes for clean frontend field mapping
      const pathParts = issue.path.filter(
        (p) => p !== 'body' && p !== 'params' && p !== 'query'
      );
      const field = pathParts.join('.') || 'general';

      let msg = issue.message;
      if (
        msg.includes("expected string, received undefined") ||
        msg.includes("expected number, received undefined") ||
        msg.toLowerCase() === "required"
      ) {
        const friendlyField = field
          .replace(/([A-Z])/g, " $1")
          .trim()
          .toLowerCase();
        msg = `${friendlyField.charAt(0).toUpperCase() + friendlyField.slice(1)} is required`;
      }

      if (!fieldErrors[field]) {
        fieldErrors[field] = msg;
        messages.push(msg);
      }
    }

    const message = messages.join('. ') || 'Please check the form for invalid input';
    error = new ApiError(400, message, fieldErrors);
  }

  if (err instanceof multer.MulterError || err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File size exceeds the 5MB limit. Please upload a smaller image.'
        : err.message || 'File upload error';
    error = new ApiError(400, message);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.errors ? { errors: error.errors } : {}),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorMiddleware;

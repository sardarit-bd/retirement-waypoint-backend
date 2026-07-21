import { z } from "zod";

// Constants for allowed file types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const ALLOWED_PDF_TYPES = ["application/pdf"];

// z.coerce.boolean() treats ANY non-empty string as true (Boolean("false")
// is true), which breaks multipart/form-data submissions where every value
// arrives as a string. This preprocesses "false"/"0" to actual false first.
const zBooleanFromForm = () =>
  z.preprocess((val) => {
    if (typeof val === "string") {
      const normalized = val.trim().toLowerCase();
      if (normalized === "false" || normalized === "0" || normalized === "") {
        return false;
      }
      if (normalized === "true" || normalized === "1") {
        return true;
      }
    }
    return val;
  }, z.boolean());

// Create Book Validation
export const createBookValidation = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title cannot exceed 200 characters"),

    description: z.string().min(1, "Description is required"),

    authorName: z.string().min(1, "Author name is required"),

    price: z.coerce.number().min(0, "Price cannot be negative"),

    pageCount: z.coerce.number().min(1, "Page count must be at least 1"),

    featured: z.coerce.boolean().optional(),

    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),

    previewEnabled: zBooleanFromForm().optional(),

    previewEndPage: z.coerce
      .number()
      .int()
      .min(1, "Preview end page must be at least 1")
      .optional(),
  }),
});

// Update Book Validation
export const updateBookValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Book ID is required"),
  }),

  body: z.object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title cannot exceed 200 characters")
      .optional(),

    description: z.string().optional(),

    authorName: z.string().optional(),

    price: z.coerce.number().min(0, "Price cannot be negative").optional(),

    pageCount: z.coerce
      .number()
      .min(1, "Page count must be at least 1")
      .optional(),

    featured: z.coerce.boolean().optional(),

    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),

    previewEnabled: zBooleanFromForm().optional(),

    previewEndPage: z.coerce
      .number()
      .int()
      .min(1, "Preview end page must be at least 1")
      .optional(),
  }),
});

// Get Books Query Validation
export const getBooksValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    featured: z.enum(["true", "false"]).optional(),
    sortBy: z
      .enum(["title", "price", "pageCount", "createdAt", "publishedAt"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Get Book by ID Validation
export const getBookByIdValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Book ID is required"),
  }),
});

// Publish Book Validation
export const publishBookValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Book ID is required"),
  }),
});

// Archive Book Validation
export const archiveBookValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Book ID is required"),
  }),
});

// Delete Book Validation
export const deleteBookValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Book ID is required"),
  }),
});

// Public Get Books Validation
export const publicGetBooksValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    featured: z.enum(["true", "false"]).optional(),
    sortBy: z
      .enum(["title", "price", "pageCount", "createdAt", "publishedAt"])
      .default("publishedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Public Get Book by Slug Validation
export const publicGetBookBySlugValidation = z.object({
  params: z.object({
    slug: z.string().min(1, "Book slug is required"),
  }),
});

// Public Get Book Preview Validation
export const publicGetBookPreviewValidation = z.object({
  params: z.object({
    slug: z.string().min(1, "Book slug is required"),
  }),
});

// File upload validations for middleware
export const bookCoverUploadValidation = z.object({
  file: z.object({
    mimetype: z.string().refine((type) => ALLOWED_IMAGE_TYPES.includes(type), {
      message: "Invalid file type. Allowed: JPEG, JPG, PNG, WEBP",
    }),
    size: z.number().max(5 * 1024 * 1024, "File size must be less than 5MB"),
  }),
});

export const bookPdfUploadValidation = z.object({
  file: z.object({
    mimetype: z.string().refine((type) => ALLOWED_PDF_TYPES.includes(type), {
      message: "Invalid file type. Only PDF files are allowed",
    }),
    size: z.number().max(50 * 1024 * 1024, "File size must be less than 50MB"),
  }),
});

// Validate middleware helper
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
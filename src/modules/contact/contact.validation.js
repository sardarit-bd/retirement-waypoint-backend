import { z } from "zod";
import { CONTACT_STATUS } from "./contact.model.js";

// Strip any HTML tags to prevent HTML/script injection in stored text fields
const stripHtml = (value) => value.replace(/<[^>]*>/g, "").trim();

const nameSchema = z
  .string()
  .trim()
  .min(3, "Name must be at least 3 characters")
  .max(100, "Name cannot exceed 100 characters")
  .transform(stripHtml);

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email format")
  .max(255, "Email cannot exceed 255 characters")
  .toLowerCase();

const subjectSchema = z
  .string()
  .trim()
  .min(5, "Subject must be at least 5 characters")
  .max(150, "Subject cannot exceed 150 characters")
  .transform(stripHtml);

const messageSchema = z
  .string()
  .trim()
  .min(20, "Message must be at least 20 characters")
  .max(3000, "Message cannot exceed 3000 characters")
  .transform(stripHtml);

// Public: submit contact form
export const submitContactValidation = z.object({
  body: z
    .object({
      name: nameSchema,
      email: emailSchema,
      subject: subjectSchema,
      message: messageSchema,
    })
    .strict(),
});

// Admin: list messages with search/filter/pagination
export const getContactMessagesValidation = z.object({
  query: z
    .object({
      page: z
        .string()
        .regex(/^\d+$/, "Page must be a positive integer")
        .transform(Number)
        .default("1"),
      limit: z
        .string()
        .regex(/^\d+$/, "Limit must be a positive integer")
        .transform(Number)
        .default("10"),
      search: z.string().trim().max(255).optional(),
      status: z.enum(Object.values(CONTACT_STATUS)).optional(),
    })
    .partial({ page: true, limit: true }),
});

// Admin: get / delete by id
export const contactIdParamValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid message ID format"),
  }),
});

// Admin: update status
export const updateContactStatusValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid message ID format"),
  }),
  body: z
    .object({
      status: z.enum(Object.values(CONTACT_STATUS), {
        errorMap: () => ({ message: "Invalid status value" }),
      }),
    })
    .strict(),
});

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
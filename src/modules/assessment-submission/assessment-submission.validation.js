import { z } from 'zod';

// Participant schema
const participantSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email cannot exceed 255 characters')
    .trim()
    .toLowerCase(),
});

// Answer schema
const answerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  domainId: z.string().min(1, 'Domain ID is required'),
  value: z.number().int().min(0, 'Value must be a positive integer'),
  score: z.number().int().min(0, 'Score must be a positive integer'),
});


// Reflection schema
const reflectionSchema = z.object({
  domainId: z.string().min(1, 'Domain ID is required'),
  domainKey: z.string().min(1, 'Domain key is required'),
  question: z.string().min(1, 'Reflection question is required'),
  answer: z.string().max(5000, 'Reflection answer cannot exceed 5000 characters').default(''),
});

// Submission validation
const submissionSchema = z.object({
  participant: participantSchema,
  answers: z.array(answerSchema).min(1),
  reflections: z.array(reflectionSchema).default([]),
  userId: z.string().optional().nullable(),
});

// Validation for submission
export const submitAssessmentValidation = z.object({
  params: z.object({
    slug: z.string().min(1, 'Assessment slug is required'),
  }),
  body: submissionSchema,
});

// Validation for getting submission by ID
export const getSubmissionByIdValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid submission ID format'),
  }),
});

// Validation for getting submissions by email
export const getSubmissionsByEmailValidation = z.object({
  params: z.object({
    email: z.string().email('Invalid email format').toLowerCase().trim(),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  }),
});

// Validation for getting submissions by assessment
export const getSubmissionsByAssessmentValidation = z.object({
  params: z.object({
    assessmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid assessment ID format'),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  }),
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